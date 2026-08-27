PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'client')),
  client_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_client_id
ON users(client_id);

CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

CREATE TABLE IF NOT EXISTS landing_pages (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  template TEXT NOT NULL CHECK (
    template IN (
      'template1',
      'template2',
      'template3',
      'template4',
      'template5'
    )
  ),
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published')
  ),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (client_id)
    REFERENCES clients(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_landing_pages_client_id
ON landing_pages(client_id);

CREATE INDEX IF NOT EXISTS idx_landing_pages_slug
ON landing_pages(slug);

CREATE INDEX IF NOT EXISTS idx_landing_pages_status
ON landing_pages(status);
