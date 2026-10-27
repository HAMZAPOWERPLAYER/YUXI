import { toLocalDayKey } from '@/utils/date';

let overrideNow: number | null = null;

/**
 * The only source of "now" in the app. Screens and pure logic never call
 * Date.now() directly, so tests can run whole flows with a fake clock.
 */
export function now(): number {
  return overrideNow ?? Date.now();
}

/** Local calendar day key for the current (or supplied) instant. */
export function todayKey(timestampMs: number = now()): string {
  return toLocalDayKey(timestampMs);
}

/** Test hook. Pass null to restore the real device clock. */
export function setClockForTests(timestampMs: number | null): void {
  overrideNow = timestampMs;
}

export function isClockOverridden(): boolean {
  return overrideNow !== null;
}
