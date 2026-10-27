const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

function pad(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Converts an epoch timestamp to the device's LOCAL calendar date key. */
export function toLocalDayKey(timestampMs: number): string {
  const date = new Date(timestampMs);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** True when the string is a real YYYY-MM-DD calendar date. */
export function isValidDayKey(value: string): boolean {
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function parseDayKeyParts(value: string): { year: number; month: number; day: number } {
  const match = DAY_KEY_PATTERN.exec(value);
  if (!match || !isValidDayKey(value)) {
    throw new Error(`Invalid day key: ${value}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** Local midnight for a YYYY-MM-DD key. */
export function startOfLocalDayMs(value: string): number {
  const { year, month, day } = parseDayKeyParts(value);
  return new Date(year, month - 1, day, 0, 0, 0, 0).getTime();
}

/** Adds whole calendar days to a key without timezone/DST drift. */
export function addDaysToKey(value: string, days: number): string {
  const { year, month, day } = parseDayKeyParts(value);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + Math.trunc(days));
  return toLocalDayKey(date.getTime());
}

/**
 * Whole calendar days from `from` to `to`. Positive when `to` is later.
 * Uses UTC midnight of the local calendar components so DST changes do not
 * produce fractional days.
 */
export function daysBetweenKeys(from: string, to: string): number {
  const a = parseDayKeyParts(from);
  const b = parseDayKeyParts(to);
  const aUtc = Date.UTC(a.year, a.month - 1, a.day);
  const bUtc = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((bUtc - aUtc) / MS_PER_DAY);
}

/** Lexicographic comparison is safe for zero-padded ISO day keys. */
export function compareDayKeys(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive list of day keys ending at `endKey`. */
export function recentDayKeys(endKey: string, count: number): string[] {
  const safeCount = Math.max(0, Math.trunc(count));
  const keys: string[] = [];
  for (let offset = safeCount - 1; offset >= 0; offset -= 1) {
    keys.push(addDaysToKey(endKey, -offset));
  }
  return keys;
}

/** Duration in whole minutes, rounded down. */
export function minutesFromSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.floor(seconds / 60);
}
