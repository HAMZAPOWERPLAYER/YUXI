export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  level: LogLevel;
  message: string;
  details?: unknown;
  at: number;
};

const MAX_ENTRIES = 200;
const entries: LogEntry[] = [];

/**
 * Local, in-memory logger. No network, no analytics, no persistence.
 * Dev builds mirror entries to the console for debugging.
 */
export function logEvent(level: LogLevel, message: string, details?: unknown): void {
  entries.push({ level, message, details, at: Date.now() });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }

  if (__DEV__) {
    if (level === 'error') {
      console.error(`[yuxi] ${message}`, details ?? '');
    } else if (level === 'warn') {
      console.warn(`[yuxi] ${message}`, details ?? '');
    }
    // Debug/info entries stay in memory only; they are readable via getLogEntries().
  }
}

export function getLogEntries(): readonly LogEntry[] {
  return [...entries];
}

export function clearLogEntries(): void {
  entries.length = 0;
}
