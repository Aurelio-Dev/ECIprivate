import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { pool } from './db.js';
import { migrateUsers } from './user-migration.js';

const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(200) NOT NULL
  )`);
  await migrateUsers(pool);
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_sessions (
    token_hash CHAR(64) PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES eci_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS eci_sessions_user_id_idx ON eci_sessions (user_id)');
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_revision (
    id SMALLINT PRIMARY KEY, version BIGINT NOT NULL CHECK (version >= 0)
  )`);
  await pool.query('INSERT INTO eci_revision (id, version) VALUES (1, 0) ON CONFLICT (id) DO NOTHING');
  await pool.query(`CREATE TABLE IF NOT EXISTS eci_records (
    kind VARCHAR(20) NOT NULL, id VARCHAR(100) NOT NULL, payload JSONB NOT NULL,
    PRIMARY KEY (kind, id)
  )`);
  // A API acessa o banco como dona das tabelas e não é afetada. O RLS fecha as tabelas para a Data API do Supabase.
  for (const table of ['eci_users', 'eci_sessions', 'eci_revision', 'eci_records']) await pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
  const { rows: users } = await pool.query('SELECT COUNT(*)::int AS total FROM eci_users');
  if (users[0].total) console.log('Banco preparado. Usuário existente preservado.');
  else {
    const username = (process.env.ECI_SETUP_USERNAME || await rl.question('Usuário administrador: ')).trim();
    const password = process.env.ECI_SETUP_PASSWORD || await rl.question('Senha inicial (mínimo 12 caracteres; ela ficará visível na digitação): ');
    if (!username || username.length > 100 || password.length < 12 || password.length > 512) throw new Error('Informe usuário de até 100 caracteres e senha de 12 a 512 caracteres.');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    await pool.query('INSERT INTO eci_users (username, password_hash, role) VALUES ($1, $2, $3)', [username, `${salt}:${hash}`, 'admin']);
    console.log('Administrador criado.');
  }
} catch (error) {
  console.error('Falha na configuração:', error.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
