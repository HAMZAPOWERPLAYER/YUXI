import type { KanaProgress } from '@/types/kana';

import type { DatabaseConnection } from '../types';
import {
  clearSrsItems,
  countDueSrsItems,
  countSrsItems,
  getDueSrsItems,
  getSrsItem,
  getSrsItemsByType,
  saveManySrsItems,
  saveSrsItem,
} from './srsRepository';
import { kanaProgressToSrsItem, srsItemToKanaProgress } from '@/features/srs';

/**
 * Kana-shaped compatibility facade over `srs_items`. The canonical row is
 * generalized; these functions keep the Part 1 screens and tests unchanged.
 */
export async function getKanaProgress(
  db: DatabaseConnection,
  kanaId: string,
): Promise<KanaProgress | null> {
  const item = await getSrsItem(db, kanaId, 'kana');
  return item ? srsItemToKanaProgress(item) : null;
}

export async function getAllKanaProgress(db: DatabaseConnection): Promise<KanaProgress[]> {
  const items = await getSrsItemsByType(db, 'kana');
  return items.map(srsItemToKanaProgress);
}

export async function saveKanaProgress(
  db: DatabaseConnection,
  progress: KanaProgress,
): Promise<void> {
  await saveSrsItem(db, kanaProgressToSrsItem(progress));
}

/**
 * Writes several rows sequentially. Callers that need all-or-nothing semantics
 * wrap this in db.withTransactionAsync() (for example the import flow).
 */
export async function saveManyKanaProgress(
  db: DatabaseConnection,
  items: readonly KanaProgress[],
): Promise<void> {
  await saveManySrsItems(
    db,
    items.map((item) => kanaProgressToSrsItem(item)),
  );
}

export async function getDueKanaProgress(
  db: DatabaseConnection,
  at: number,
  limit: number,
): Promise<KanaProgress[]> {
  const items = await getDueSrsItems(db, at, limit, 'kana');
  return items.map(srsItemToKanaProgress);
}

export async function countDueKanaProgress(db: DatabaseConnection, at: number): Promise<number> {
  return countDueSrsItems(db, at, 'kana');
}

export async function countKanaProgress(db: DatabaseConnection): Promise<number> {
  return countSrsItems(db, 'kana');
}

export async function clearKanaProgress(db: DatabaseConnection): Promise<void> {
  await db.withTransactionAsync(async () => {
    await clearSrsItems(db, 'kana');
    await db.execAsync('DELETE FROM kana_progress');
  });
}
