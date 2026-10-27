import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { logEvent } from '@/utils/logger';

import { runMigrations } from './migrations/runner';
import type { DatabaseConnection } from './types';

export const DATABASE_NAME = 'yuxi.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openAndPrepare(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db as DatabaseConnection);
  logEvent('info', 'Database ready');
  return db;
}

/**
 * Lazily opens the single app database. A failed open clears the cache so a
 * retry from the error screen can try again instead of reusing a rejected
 * promise.
 */
export function getDatabase(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndPrepare().catch((error: unknown) => {
      databasePromise = null;
      logEvent('error', 'Could not open database', error);
      throw error;
    });
  }
  return databasePromise;
}

/** Used by tests and the reset flow; the next getDatabase() reopens cleanly. */
export async function closeDatabase(): Promise<void> {
  const pending = databasePromise;
  databasePromise = null;
  if (pending) {
    const db = await pending.catch(() => null);
    await db?.closeAsync();
  }
}
