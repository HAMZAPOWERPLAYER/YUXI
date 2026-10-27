export type SqlValue = string | number | null;

export type SqlRunResult = {
  changes: number;
  lastInsertRowId: number;
};

/**
 * The small database surface the app depends on. Keeping this interface
 * narrow lets the migration and repository tests run against sql.js while the
 * app runs against expo-sqlite.
 */
export type DatabaseConnection = {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: SqlValue[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
};
