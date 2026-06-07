require('dotenv').config();

const { Pool } = require('pg');

const connectionString = process.env.SUPABASE_DB_URL || '';
const enabled = !!connectionString;

const pool = enabled
  ? new Pool({
      connectionString,
      ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    })
  : null;

async function query(sql, params = []) {
  if (!pool) throw new Error('Supabase database is not configured');
  return pool.query(sql, params);
}

async function queryOne(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

async function queryAll(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  enabled,
  pool,
  query,
  queryOne,
  queryAll,
};
