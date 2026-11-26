import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { pool } from './db.js';
import { emptyData, validateData } from './validation.js';

const app = express();
const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:8081').split(',').map(s => s.trim());
app.disable('x-powered-by');
// Na Vercel a requisição chega por um proxy; sem isso, req.ip seria o mesmo para todos e o limite de tentativas de login bloquearia todo mundo junto.
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin(origin, cb) { cb(null, !origin || allowed.includes(origin)); }, credentials: true, allowedHeaders: ['Content-Type', 'Authorization', 'X-ECI-Request'] }));
app.use(express.json({ limit: '5mb' }));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.get('Origin') && !allowed.includes(req.get('Origin'))) return res.status(403).json({ error: 'Origem não autorizada.' });
  if (req.method !== 'GET' && req.get('X-ECI-Request') !== '1') return res.status(403).json({ error: 'Solicitação inválida.' });
  next();
});

const digest = token => createHash('sha256').update(token).digest('hex');
const cookieOptions = remember => ({ httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === 'true', path: '/', ...(remember ? { maxAge: 7 * 86400000 } : {}) });
const tokenFrom = req => {
  const header = req.get('Authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const cookie = (req.get('Cookie') || '').split(';').map(v => v.trim()).find(v => v.startsWith('eci_session='));
  return cookie?.slice('eci_session='.length);
};
const auth = async (req, res, next) => {
  try {
    const token = tokenFrom(req);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Sessão necessária.' });
    const { rows } = await pool.query('SELECT u.id, u.username, u.role, s.token_hash FROM eci_sessions s JOIN eci_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at > now() AND u.active', [digest(token)]);
    if (!rows.length) return res.status(401).json({ error: 'Sessão expirada.' });
    req.user = rows[0];
    next();
  } catch (error) { next(error); }
};
const attempts = new Map();
app.post('/api/login', async (req, res, next) => {
  try {
    const key = req.ip;
    const now = Date.now();
    const prior = (attempts.get(key) || []).filter(t => now - t < 15 * 60000);
    if (prior.length >= 10) return res.status(429).json({ error: 'Muitas tentativas. Aguarde 15 minutos.' });
    const username = typeof req.body?.usuario === 'string' ? req.body.usuario.trim().slice(0, 100) : '';
    const password = typeof req.body?.senha === 'string' ? req.body.senha.slice(0, 512) : '';
    const db = await pool.connect();
    let token, remember, session;
    try {
      await db.query('BEGIN');
      const { rows } = await db.query('SELECT id, username, password_hash, role, active FROM eci_users WHERE username=$1 FOR UPDATE', [username]);
      const [salt, expected] = (rows[0]?.password_hash || '00000000000000000000000000000000:' + '00'.repeat(64)).split(':');
      const actual = scryptSync(password, salt, 64);
      if (!rows.length || !timingSafeEqual(actual, Buffer.from(expected, 'hex')) || !rows[0].active) {
        await db.query('ROLLBACK');
        prior.push(now); attempts.set(key, prior);
        return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
      }
      attempts.delete(key);
      token = randomBytes(32).toString('hex');
      remember = req.body?.remember === true;
      const hours = remember ? 168 : 12;
      await db.query('INSERT INTO eci_sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(hours => $3::int))', [digest(token), rows[0].id, hours]);
      session = { usuario: rows[0].username, perfil: rows[0].role, entradaEm: new Date().toISOString() };
      await db.query('COMMIT');
    } catch (error) { await db.query('ROLLBACK'); throw error; } finally { db.release(); }
    res.cookie('eci_session', token, cookieOptions(remember));
    res.json(req.body?.native === true ? { ...session, token } : session);
  } catch (error) { next(error); }
});
app.get('/api/session', auth, (req, res) => res.json({ usuario: req.user.username, perfil: req.user.role, entradaEm: '' }));
app.post('/api/logout', auth, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM eci_sessions WHERE token_hash=$1', [req.user.token_hash]);
    res.clearCookie('eci_session', cookieOptions(false));
    res.status(204).end();
  } catch (error) { next(error); }
});

const adminOnly = (req, res, next) => req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Acesso restrito a administradores.' });
const validPassword = value => typeof value === 'string' && value.length >= 12 && value.length <= 512;
const hashPassword = password => { const salt = randomBytes(16).toString('hex'); return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`; };
// Até 18 dígitos: cabe no BIGINT do PostgreSQL.
const validId = value => /^[1-9][0-9]{0,17}$/.test(value);
app.get('/api/users', auth, adminOnly, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id::text AS id, username, role, active FROM eci_users ORDER BY username');
    res.json(rows.map(row => ({ id: String(row.id), username: row.username, role: row.role, active: !!row.active })));
  } catch (error) { next(error); }
});
app.post('/api/users', auth, adminOnly, async (req, res, next) => {
  const { username, password, role } = req.body || {};
  if (typeof username !== 'string' || !username.trim() || username.trim().length > 100 || !validPassword(password) || !['admin', 'operator'].includes(role)) return res.status(400).json({ error: 'Informe usuário, perfil e senha de 12 a 512 caracteres.' });
  try {
    await pool.query('INSERT INTO eci_users (username, password_hash, role, active) VALUES ($1, $2, $3, TRUE)', [username.trim(), hashPassword(password), role]);
    res.status(201).json({ message: 'Usuário criado.' });
  } catch (error) { if (error.code === '23505') return res.status(409).json({ error: 'Nome de acesso já cadastrado.' }); next(error); }
});
app.patch('/api/users/:id/active', auth, adminOnly, async (req, res, next) => {
  if (!validId(req.params.id) || typeof req.body?.active !== 'boolean') return res.status(400).json({ error: 'Dados inválidos.' });
  const db = await pool.connect().catch(next); if (!db) return;
  try {
    await db.query('BEGIN');
    // Bloqueia todos os administradores em ordem para serializar desativações concorrentes.
    const { rows: admins } = await db.query("SELECT id, active FROM eci_users WHERE role='admin' ORDER BY id FOR UPDATE");
    const { rows } = await db.query('SELECT id, role, active FROM eci_users WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!rows.length) { await db.query('ROLLBACK'); return res.status(404).json({ error: 'Usuário não encontrado.' }); }
    if (!req.body.active && rows[0].role === 'admin' && rows[0].active && admins.filter(row => row.active).length <= 1) { await db.query('ROLLBACK'); return res.status(409).json({ error: 'O último administrador ativo não pode ser desativado.' }); }
    await db.query('UPDATE eci_users SET active=$1 WHERE id=$2', [req.body.active, req.params.id]);
    if (!req.body.active) await db.query('DELETE FROM eci_sessions WHERE user_id=$1', [req.params.id]);
    await db.query('COMMIT'); res.json({ message: 'Estado atualizado.' });
  } catch (error) { await db.query('ROLLBACK'); next(error); } finally { db.release(); }
});
app.post('/api/users/:id/password', auth, adminOnly, async (req, res, next) => {
  if (!validId(req.params.id) || !validPassword(req.body?.password)) return res.status(400).json({ error: 'Informe senha de 12 a 512 caracteres.' });
  const db = await pool.connect().catch(next); if (!db) return;
  try {
    const hash = hashPassword(req.body.password);
    await db.query('BEGIN');
    const result = await db.query('UPDATE eci_users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    if (!result.rowCount) { await db.query('ROLLBACK'); return res.status(404).json({ error: 'Usuário não encontrado.' }); }
    await db.query('DELETE FROM eci_sessions WHERE user_id=$1', [req.params.id]);
    await db.query('COMMIT'); res.json({ message: 'Senha redefinida e sessões encerradas.' });
  } catch (error) { await db.query('ROLLBACK'); next(error); } finally { db.release(); }
});

async function readData(db) {
  const data = emptyData();
  const { rows } = await db.query('SELECT kind, payload FROM eci_records ORDER BY id');
  for (const row of rows) {
    if (!(row.kind in data)) throw new Error('Tipo de registro desconhecido.');
    data[row.kind].push(typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload);
  }
  return data;
}
app.get('/api/data', auth, async (req, res, next) => {
  const connection = await pool.connect().catch(next);
  if (!connection) return;
  try {
    await connection.query('BEGIN');
    const { rows: version } = await connection.query('SELECT version FROM eci_revision WHERE id=1 FOR SHARE');
    const data = await readData(connection);
    await connection.query('COMMIT');
    res.json({ version: Number(version[0].version), data });
  } catch (error) { await connection.query('ROLLBACK'); next(error); }
  finally { connection.release(); }
});
app.put('/api/data', auth, async (req, res, next) => {
  const connection = await pool.connect().catch(next);
  if (!connection) return;
  try {
    await connection.query('BEGIN');
    const { rows } = await connection.query('SELECT version FROM eci_revision WHERE id=1 FOR UPDATE');
    if (!Number.isSafeInteger(req.body?.version) || Number(rows[0].version) !== req.body.version) {
      await connection.query('ROLLBACK');
      return res.status(409).json({ error: 'Os dados foram alterados em outro dispositivo. Recarregue antes de tentar novamente.' });
    }
    const previous = await readData(connection);
    let data;
    try { data = validateData(req.body.data, previous); }
    catch (error) { await connection.query('ROLLBACK'); return res.status(400).json({ error: error.message || 'Dados inválidos.' }); }
    for (const [kind, items] of Object.entries(data)) {
      for (const item of items) await connection.query('INSERT INTO eci_records (kind, id, payload) VALUES ($1, $2, $3::jsonb) ON CONFLICT (kind, id) DO UPDATE SET payload=EXCLUDED.payload', [kind, item.id, JSON.stringify(item)]);
    }
    const version = req.body.version + 1;
    await connection.query('UPDATE eci_revision SET version=$1 WHERE id=1', [version]);
    await connection.query('COMMIT');
    res.json({ version, data });
  } catch (error) { await connection.query('ROLLBACK'); next(error); }
  finally { connection.release(); }
});
app.use((err, req, res, next) => {
  console.error('Erro na API.', typeof err.code === 'string' && /^[A-Z0-9_]+$/.test(err.code) ? err.code : '');
  if (!res.headersSent) res.status(500).json({ error: 'Não foi possível acessar o servidor.' });
});

// Na Vercel o app é exportado para api/index.mjs e não abre porta; no computador, npm start continua igual.
if (!process.env.VERCEL) {
  const port = Number(process.env.PORT || 3333);
  app.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`API ECI na porta ${port}`));
}
export default app;
