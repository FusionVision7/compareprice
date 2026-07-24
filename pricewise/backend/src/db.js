import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'pricewise.sqlite');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Every row here is either something a real user typed (searches) or a real
// price returned by the live shopping-data provider at a real timestamp
// (price_snapshots). Nothing in this schema is designed to hold invented data.
db.exec(`
  CREATE TABLE IF NOT EXISTS searches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_query TEXT NOT NULL,
    raw_query TEXT NOT NULL,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    normalized_query TEXT NOT NULL,
    product_title TEXT NOT NULL,
    source TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL,
    link TEXT NOT NULL,
    thumbnail TEXT,
    rating REAL,
    reviews INTEGER,
    fetch_batch TEXT NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_query ON price_snapshots(normalized_query, fetched_at);
  CREATE INDEX IF NOT EXISTS idx_searches_query ON searches(normalized_query, created_at);
`);

export function normalizeQuery(q) {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}
