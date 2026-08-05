-- Links: short URLs with optional UTM parameters
CREATE TABLE IF NOT EXISTS links (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT    NOT NULL,
  slug          TEXT    NOT NULL UNIQUE,
  destination   TEXT    NOT NULL,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  utm_content   TEXT,
  utm_term      TEXT,
  status        TEXT    NOT NULL DEFAULT 'active',
  click_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- UTM presets for quick form filling
CREATE TABLE IF NOT EXISTS utm_presets (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  icon        TEXT,
  source      TEXT NOT NULL,
  medium      TEXT NOT NULL,
  campaign    TEXT,
  content     TEXT,
  term        TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Default presets (INSERT OR IGNORE so re-running is safe)
INSERT OR IGNORE INTO utm_presets (id, name, icon, source, medium) VALUES
  (1, 'YouTube Orgânico', 'YT', 'youtube', 'organico'),
  (2, 'Instagram Orgânico', 'IG', 'instagram', 'organico'),
  (3, 'Instagram Pago', 'IG+', 'instagram', 'pago'),
  (4, 'WhatsApp', 'WA', 'whatsapp', 'direto'),
  (5, 'E-mail Sellflux', 'EMAIL', 'email', 'sellflux'),
  (6, 'Google Ads', 'GG', 'google', 'cpc');
