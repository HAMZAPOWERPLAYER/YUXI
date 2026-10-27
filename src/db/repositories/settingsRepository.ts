import type { DatabaseConnection } from '../types';
import {
  type AppSettings,
  type SettingKey,
  decodeSettings,
  encodeSettingsPatch,
  isSettingKey,
} from '@/features/settings/settingsModel';

type SettingRow = { key: string; value: string };

/**
 * Reads all known settings. Missing or invalid rows fall back to safe defaults
 * (optionally overridden by device-derived defaults such as language).
 */
export async function getSettings(
  db: DatabaseConnection,
  overrides: Partial<AppSettings> = {},
): Promise<AppSettings> {
  const rows = await db.getAllAsync<SettingRow>('SELECT key, value FROM kv_settings');
  const stored: Partial<Record<SettingKey, string>> = {};

  for (const row of rows) {
    if (isSettingKey(row.key)) {
      stored[row.key] = row.value;
    }
  }

  return decodeSettings(stored, overrides);
}

/** Writes only the supplied fields inside one transaction. */
export async function updateSettings(
  db: DatabaseConnection,
  patch: Partial<AppSettings>,
  overrides: Partial<AppSettings> = {},
): Promise<AppSettings> {
  const rows = encodeSettingsPatch(patch);

  if (rows.length > 0) {
    await db.withTransactionAsync(async () => {
      for (const [key, value] of rows) {
        await db.runAsync(
          `INSERT INTO kv_settings (key, value)
           VALUES (?, ?)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          key,
          value,
        );
      }
    });
  }

  return getSettings(db, overrides);
}

export async function clearSettings(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM kv_settings');
}
