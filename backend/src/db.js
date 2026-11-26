import 'dotenv/config';
import pg from 'pg';

export const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('Defina DATABASE_URL no .env.');
// O Supabase exige SSL. Com DB_SSL_CA, o certificado do servidor é conferido; DB_SSL=false serve para um Postgres local.
export const ssl = process.env.DB_SSL === 'false'
  ? false
  : process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA.replace(/\\n/g, '\n') } : { rejectUnauthorized: false };
// Na Vercel cada instância da função abre o próprio pool; use DB_POOL_MAX baixo lá.
export const pool = new pg.Pool({ connectionString: databaseUrl, ssl, max: Number(process.env.DB_POOL_MAX || 10) });
