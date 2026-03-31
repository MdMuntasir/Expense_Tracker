-- Migration: savings table
CREATE TABLE IF NOT EXISTS savings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount REAL NOT NULL,
  month TEXT NOT NULL,
  notes TEXT,
  transferred_source_id INTEGER REFERENCES sources(id) ON DELETE SET NULL,
  transferred_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
