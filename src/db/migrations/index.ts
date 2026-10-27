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

/**
 * Schema v2 generalizes scheduling. `srs_items` becomes the canonical table
 * for kana, vocabulary and sentences. The v1 `kana_progress` table is kept and
 * mirrored for one release so a user who rolls back to a v1 build still sees
 * their kana progress.
 */
const generalizedProgressSchema = `
CREATE TABLE IF NOT EXISTS srs_items (
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
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
  lapses INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, item_type)
);

INSERT OR IGNORE INTO srs_items (
  item_id, item_type, seen, correct, wrong, streak, ease, interval_days,
  repetitions, due_at, last_seen_at, first_seen_at, lapses
)
SELECT
  kana_id, 'kana', seen, correct, wrong, streak, ease, interval_days,
  repetitions, due_at, last_seen_at, first_seen_at, lapses
FROM kana_progress;

ALTER TABLE review_log ADD COLUMN item_type TEXT NOT NULL DEFAULT 'kana';

CREATE TABLE IF NOT EXISTS lesson_progress (
  lesson_id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  started_at INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER NOT NULL DEFAULT 0,
  last_studied_at INTEGER NOT NULL DEFAULT 0,
  questions INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS bookmarks (
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (item_id, item_type)
);

CREATE INDEX IF NOT EXISTS idx_srs_items_due_at ON srs_items(due_at);
CREATE INDEX IF NOT EXISTS idx_srs_items_type_due_at ON srs_items(item_type, due_at);
CREATE INDEX IF NOT EXISTS idx_review_log_item_type_at ON review_log(item_type, at);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_unit_id ON lesson_progress(unit_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at);
`;

export const migrations: readonly Migration[] = [
  {
    version: 1,
    name: 'initial schema',
    sql: initialSchema,
  },
  {
    version: 2,
    name: 'generalized progress, lessons and bookmarks',
    sql: generalizedProgressSchema,
  },
];

export const LATEST_SCHEMA_VERSION = migrations.reduce(
  (latest, migration) => Math.max(latest, migration.version),
  0,
);
