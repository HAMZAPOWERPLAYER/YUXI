import { logEvent } from '@/utils/logger';

import type { DatabaseConnection } from '../types';
import { type Migration, migrations } from './index';

type UserVersionRow = {
  user_version: number;
};

/** Reads PRAGMA user_version safely on both expo-sqlite and sql.js. */
export async function readSchemaVersion(db: DatabaseConnection): Promise<number> {
  const row = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const value = row?.user_version;
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : 0;
}

/**
 * Applies every pending migration in order. Each migration is atomic: its SQL
 * and the user_version bump commit together or not at all. Migrations are
 * idempotent so an interrupted upgrade can be retried safely.
 */
export async function runMigrations(
  db: DatabaseConnection,
  migrationList: readonly Migration[] = migrations,
): Promise<number> {
  const startingVersion = await readSchemaVersion(db);
  const latestVersion = migrationList.reduce(
    (latest, migration) => Math.max(latest, migration.version),
    0,
  );

  if (startingVersion > latestVersion) {
    throw new Error(
      `Database schema v${startingVersion} is newer than this app supports (v${latestVersion}).`,
    );
  }

  let currentVersion = startingVersion;
  const pending = migrationList
    .filter((migration) => migration.version > startingVersion)
    .sort((a, b) => a.version - b.version);

  for (const migration of pending) {
    if (!Number.isInteger(migration.version) || migration.version <= 0) {
      throw new Error(`Invalid migration version: ${migration.version}`);
    }

    try {
      await db.withTransactionAsync(async () => {
        await db.execAsync(migration.sql);
        // user_version cannot be parameterized; the value comes from code.
        await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      });
      currentVersion = migration.version;
      logEvent('info', `Applied database migration ${migration.version}: ${migration.name}`);
    } catch (error) {
      logEvent('error', `Database migration ${migration.version} failed`, error);
      throw error;
    }
  }

  return currentVersion;
}
