export type Migration = {
  /** PRAGMA user_version this migration brings the database to. */
  version: number;
  name: string;
  sql: string;
};

const initialSchema = `
CREATE TABLE IF NOT EXISTS kv_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kana_progress (
  kana_id TEXT PRIMARY KEY,
  seen INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  ease REAL NOT NULL DEFAULT 2.5,
  interval_days REAL NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_at INTEGER NOT NULL DEFAULT 0,
  last_seen_at INTEGER NOT NULL DEFAULT 0,
  first_seen_at INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS review_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kana_id TEXT NOT NULL,
  mode TEXT NOT NULL,
  correct INTEGER NOT NULL,
  quality INTEGER NOT NULL,
  response_ms INTEGER NOT NULL,
  at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_stats (
  day TEXT PRIMARY KEY,
  xp INTEGER NOT NULL DEFAULT 0,
  seconds_active INTEGER NOT NULL DEFAULT 0,
  questions INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  goal_met INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX IF NOT EXISTS idx_kana_progress_due_at ON kana_progress(due_at);
CREATE INDEX IF NOT EXISTS idx_review_log_at ON review_log(at);
CREATE INDEX IF NOT EXISTS idx_review_log_kana_id ON review_log(kana_id);
`;

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: initialSchema,
  },
];

export const LATEST_SCHEMA_VERSION = migrations.reduce(
  (latest, migration) => Math.max(latest, migration.version),
  0,
);
