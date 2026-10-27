import type { DatabaseConnection } from '@/db/types';
import type { Bookmark, BookmarkItemType } from '@/types/srs';

type BookmarkRow = {
  item_id: string;
  item_type: string;
  unit_id: string;
  created_at: number;
};

function mapRow(row: BookmarkRow): Bookmark {
  return {
    itemId: row.item_id,
    itemType: row.item_type as BookmarkItemType,
    unitId: row.unit_id,
    createdAt: row.created_at,
  };
}

export async function getAllBookmarks(db: DatabaseConnection): Promise<Bookmark[]> {
  const rows = await db.getAllAsync<BookmarkRow>(
    `SELECT item_id, item_type, unit_id, created_at
     FROM bookmarks
     ORDER BY created_at DESC, item_id ASC`,
  );
  return rows.map(mapRow);
}

export async function getBookmarksForUnit(
  db: DatabaseConnection,
  unitId: string,
): Promise<Bookmark[]> {
  const rows = await db.getAllAsync<BookmarkRow>(
    `SELECT item_id, item_type, unit_id, created_at
     FROM bookmarks
     WHERE unit_id = ?
     ORDER BY created_at DESC, item_id ASC`,
    unitId,
  );
  return rows.map(mapRow);
}

export async function isBookmarked(
  db: DatabaseConnection,
  itemId: string,
  itemType: BookmarkItemType,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM bookmarks WHERE item_id = ? AND item_type = ?',
    itemId,
    itemType,
  );
  return (row?.count ?? 0) > 0;
}

export async function addBookmark(db: DatabaseConnection, bookmark: Bookmark): Promise<void> {
  await db.runAsync(
    `INSERT INTO bookmarks (item_id, item_type, unit_id, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(item_id, item_type) DO UPDATE SET
       unit_id = excluded.unit_id`,
    bookmark.itemId,
    bookmark.itemType,
    bookmark.unitId,
    bookmark.createdAt,
  );
}

export async function removeBookmark(
  db: DatabaseConnection,
  itemId: string,
  itemType: BookmarkItemType,
): Promise<void> {
  await db.runAsync('DELETE FROM bookmarks WHERE item_id = ? AND item_type = ?', itemId, itemType);
}

/** Adds the bookmark when missing and removes it otherwise. */
export async function toggleBookmark(db: DatabaseConnection, bookmark: Bookmark): Promise<boolean> {
  if (await isBookmarked(db, bookmark.itemId, bookmark.itemType)) {
    await removeBookmark(db, bookmark.itemId, bookmark.itemType);
    return false;
  }
  await addBookmark(db, bookmark);
  return true;
}

export async function clearBookmarks(db: DatabaseConnection): Promise<void> {
  await db.execAsync('DELETE FROM bookmarks');
}
