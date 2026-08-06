-- Class instances: each time the admin opens a live class
CREATE TABLE IF NOT EXISTS aulas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo      TEXT,
  started_at  TEXT NOT NULL DEFAULT (datetime('now')),
  ended_at    TEXT,
  status      TEXT NOT NULL DEFAULT 'live'
);

-- Add aula_id to sessions so we know which class each student attended
-- ALTER TABLE is idempotent via this pattern — safe to re-run
ALTER TABLE sessoes ADD COLUMN aula_id INTEGER REFERENCES aulas(id);
