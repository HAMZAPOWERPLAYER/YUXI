import { join } from 'node:path';

import initSqlJs from 'sql.js';

import type { DatabaseConnection, SqlValue } from '@/db/types';

export type TestDatabase = DatabaseConnection & {
  close: () => void;
};

/**
 * Minimal adapter from expo-sqlite's async API to sql.js. Tests exercise the
 * real migration SQL and repository queries without a device.
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const raw = new SQL.Database();

  function all<T>(source: string, params: SqlValue[]): T[] {
    const statement = raw.prepare(source);
    try {
      if (params.length > 0) {
        statement.bind(params);
      }
      const rows: T[] = [];
      while (statement.step()) {
        rows.push(statement.getAsObject() as T);
      }
      return rows;
    } finally {
      statement.free();
    }
  }

  return {
    async execAsync(source: string): Promise<void> {
      raw.exec(source);
    },
    async runAsync(source: string, ...params: SqlValue[]) {
      raw.run(source, params);
      const idResult = raw.exec('SELECT last_insert_rowid() AS id');
      const id = idResult[0]?.values[0]?.[0];
      return {
        changes: raw.getRowsModified(),
        lastInsertRowId: typeof id === 'number' ? id : 0,
      };
    },
    async getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null> {
      return all<T>(source, params)[0] ?? null;
    },
    async getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]> {
      return all<T>(source, params);
    },
    async withTransactionAsync(task: () => Promise<void>): Promise<void> {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
    close(): void {
      raw.close();
    },
  };
}
