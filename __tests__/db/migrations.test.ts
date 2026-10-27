import { LATEST_SCHEMA_VERSION, migrations } from '@/db/migrations';
import { readSchemaVersion, runMigrations } from '@/db/migrations/runner';
import type { DatabaseConnection } from '@/db/types';

import { createTestDatabase, type TestDatabase } from '../helpers/testDatabase';

type NameRow = { name: string };
type TableInfoRow = { name: string };

async function tableNames(db: DatabaseConnection): Promise<string[]> {
  const rows = await db.getAllAsync<NameRow>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  return rows.map((row) => row.name);
}

async function indexNames(db: DatabaseConnection): Promise<string[]> {
  const rows = await db.getAllAsync<NameRow>(
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );
  return rows.map((row) => row.name);
}

describe('migration definitions', () => {
  it('has unique, strictly increasing positive versions', () => {
    expect(migrations.length).toBeGreaterThan(0);
    expect(LATEST_SCHEMA_VERSION).toBe(migrations[migrations.length - 1]?.version);
    migrations.forEach((migration, index) => {
      expect(Number.isInteger(migration.version)).toBe(true);
      expect(migration.version).toBe(index + 1);
      expect(migration.sql.trim().length).toBeGreaterThan(0);
    });
  });
});

describe('runMigrations', () => {
  let db: TestDatabase;

  beforeEach(async () => {
    db = await createTestDatabase();
  });

  afterEach(() => {
    db.close();
  });

  it('starts at version 0 on an empty database', async () => {
    await expect(readSchemaVersion(db)).resolves.toBe(0);
  });

  it('migrates from empty to the latest schema', async () => {
    await expect(runMigrations(db)).resolves.toBe(LATEST_SCHEMA_VERSION);
    await expect(readSchemaVersion(db)).resolves.toBe(LATEST_SCHEMA_VERSION);

    await expect(tableNames(db)).resolves.toEqual([
      'daily_stats',
      'kana_progress',
      'kv_settings',
      'meta',
      'review_log',
    ]);
    await expect(indexNames(db)).resolves.toEqual([
      'idx_kana_progress_due_at',
      'idx_review_log_at',
      'idx_review_log_kana_id',
    ]);
  });

  it('creates every required column', async () => {
    await runMigrations(db);

    const expected: Record<string, string[]> = {
      kv_settings: ['key', 'value'],
      kana_progress: [
        'kana_id',
        'seen',
        'correct',
        'wrong',
        'streak',
        'ease',
        'interval_days',
        'repetitions',
        'due_at',
        'last_seen_at',
        'first_seen_at',
        'lapses',
      ],
      review_log: ['id', 'kana_id', 'mode', 'correct', 'quality', 'response_ms', 'at'],
      daily_stats: ['day', 'xp', 'seconds_active', 'questions', 'correct', 'goal_met'],
      meta: ['key', 'value'],
    };

    for (const [table, columns] of Object.entries(expected)) {
      const rows = await db.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table})`);
      expect({ table, columns: rows.map((row) => row.name) }).toEqual({ table, columns });
    }
  });

  it('is idempotent when run again', async () => {
    await runMigrations(db);
    await expect(runMigrations(db)).resolves.toBe(LATEST_SCHEMA_VERSION);
  });

  it('keeps existing rows when re-run', async () => {
    await runMigrations(db);
    await db.runAsync('INSERT INTO meta (key, value) VALUES (?, ?)', 'firstRun', '123');
    await runMigrations(db);
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM meta WHERE key = ?',
      'firstRun',
    );
    expect(row?.value).toBe('123');
  });

  it('refuses a database written by a newer app version', async () => {
    await db.execAsync('PRAGMA user_version = 99');
    await expect(runMigrations(db)).rejects.toThrow(/newer than this app supports/);
  });

  it('rolls back a failed migration atomically', async () => {
    const badMigrations = [
      {
        version: 1,
        name: 'broken',
        sql: 'CREATE TABLE should_not_survive (id INTEGER); THIS IS NOT SQL;',
      },
    ];

    await expect(runMigrations(db, badMigrations)).rejects.toThrow();
    await expect(readSchemaVersion(db)).resolves.toBe(0);
    await expect(tableNames(db)).resolves.toEqual([]);
  });
});
