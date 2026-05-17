require('dotenv').config();
const path = require('path');
const fs = require('fs');

const USE_POSTGRES = !!process.env.DATABASE_URL;

let db;

if (USE_POSTGRES) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  db = {
    _pool: pool,
    isPostgres: true,
    prepare: () => ({ run: () => {}, get: () => null, all: () => [] }),
    queryOne: async (sql, params = []) => { const r = await pool.query(sql, params); return r.rows[0]; },
    queryAll: async (sql, params = []) => { const r = await pool.query(sql, params); return r.rows; },
    query: (sql, params = []) => pool.query(sql, params),
  };
} else {
  const Database = require('better-sqlite3');
  const DATA_DIR = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const sqlite = new Database(path.join(DATA_DIR, 'grevya.db'));
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  db = sqlite;
  db.isPostgres = false;
  db.queryOne = (sql, params = []) => Promise.resolve(sqlite.prepare(sql).get(...params));
  db.queryAll = (sql, params = []) => Promise.resolve(sqlite.prepare(sql).all(...params));
  db.query = (sql, params = []) => Promise.resolve({ rows: sqlite.prepare(sql).all(...params) });
}

module.exports = db;
