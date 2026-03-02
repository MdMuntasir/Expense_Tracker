-- Expense Tracker D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- Google OAuth sub
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('cash', 'bank', 'card', 'mobile')),
  details TEXT,                  -- JSON: { bank_name, account_number } or { system_name }
  balance REAL NOT NULL DEFAULT 0.0,
  is_default INTEGER NOT NULL DEFAULT 0,  -- 1 = default (Cash)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  title TEXT NOT NULL,
  description TEXT,
  amount REAL NOT NULL,
  date DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  source_id INTEGER NOT NULL REFERENCES sources(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_source_id INTEGER NOT NULL REFERENCES sources(id),
  to_source_id INTEGER NOT NULL REFERENCES sources(id),
  amount REAL NOT NULL,
  fee REAL NOT NULL DEFAULT 0.0,
  date DATE NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
