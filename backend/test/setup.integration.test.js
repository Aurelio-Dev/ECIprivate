import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import pg from 'pg';

test('setup cria administrador e preserva instalação existente', { skip: process.env.ECI_RUN_DB_TESTS !== '1' }, async () => {
  // Importado aqui para que o teste seja pulado sem erro quando DATABASE_URL não existir.
  const { databaseUrl, pool, ssl } = await import('../src/db.js');
  const name = `eci_test_${randomBytes(6).toString('hex')}`;
  const username = `teste_${randomBytes(6).toString('hex')}`;
  const password = randomBytes(24).toString('base64url');
  const testUrl = new URL(databaseUrl);
  testUrl.pathname = `/${name}`;
  const root = new pg.Client({ connectionString: databaseUrl, ssl });
  await root.connect();
  let created = false, db;
  try {
    await root.query(`CREATE DATABASE ${name}`);
    created = true;
    const runSetup = () => new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['src/setup.js'], {
        env: { ...process.env, DATABASE_URL: testUrl.toString(), ECI_SETUP_USERNAME: username, ECI_SETUP_PASSWORD: password },
        stdio: 'ignore',
      });
      child.once('error', reject);
      child.once('close', resolve);
    });
    assert.equal(await runSetup(), 0);
    db = new pg.Client({ connectionString: testUrl.toString(), ssl });
    await db.connect();
    const { rows: users } = await db.query('SELECT username, role, active FROM eci_users');
    assert.deepEqual(users.map(({ username, role, active }) => ({ username, role, active })), [{ username, role: 'admin', active: true }]);
    await db.query('UPDATE eci_revision SET version=7 WHERE id=1');
    assert.equal(await runSetup(), 0);
    const { rows: revision } = await db.query('SELECT version::int AS version FROM eci_revision WHERE id=1');
    assert.equal(revision[0].version, 7);
    const { rows: count } = await db.query('SELECT COUNT(*)::int AS total FROM eci_users');
    assert.equal(count[0].total, 1);
  } finally {
    if (db) await db.end();
    if (created) await root.query(`DROP DATABASE ${name}`);
    await root.end();
    await pool.end();
  }
});
