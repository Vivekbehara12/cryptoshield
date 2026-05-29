const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../database.sqlite'));

// Drop old tables and recreate with correct structure
db.exec(`
  DROP TABLE IF EXISTS token_scans;
  DROP TABLE IF EXISTS wallet_scans;

  CREATE TABLE IF NOT EXISTS token_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    risk_score INTEGER DEFAULT 0,
    warnings TEXT DEFAULT '[]',
    token_name TEXT DEFAULT 'Unknown Token',
    token_symbol TEXT DEFAULT 'UNKNOWN',
    liquidity REAL DEFAULT 0,
    volume24h REAL DEFAULT 0,
    price_usd REAL DEFAULT 0,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallet_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    reputation_score INTEGER DEFAULT 0,
    tokens_created INTEGER DEFAULT 0,
    warnings TEXT DEFAULT '[]',
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database connected and tables ready');
module.exports = db;