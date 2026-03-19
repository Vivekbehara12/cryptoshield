const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../../database.sqlite'));

db.exec(`
  CREATE TABLE IF NOT EXISTS token_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    risk_score INTEGER,
    warnings TEXT,
    token_name TEXT,
    token_symbol TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS wallet_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL,
    reputation_score INTEGER,
    tokens_created INTEGER,
    warnings TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('Database connected and tables ready');

// Export the db instance directly
module.exports = db;