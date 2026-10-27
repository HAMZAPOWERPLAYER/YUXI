import type { DatabaseConnection } from '../types';

type MetaRow = { key: string; value: string | null };

export async function getMeta(db: DatabaseConnection, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<MetaRow>('SELECT key, value FROM meta WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setMeta(
  db: DatabaseConnection,
  key: string,
  value: string | null,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO meta (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

export async function deleteMeta(db: DatabaseConnection, key: string): Promise<void> {
  await db.runAsync('DELETE FROM meta WHERE key = ?', key);
}

export async function getAllMeta(db: DatabaseConnection): Promise<Record<string, string | null>> {
  const rows = await db.getAllAsync<MetaRow>('SELECT key, value FROM meta');
  const result: Record<string, string | null> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }
  return result;
}

export async function clearMeta(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM meta');
}
