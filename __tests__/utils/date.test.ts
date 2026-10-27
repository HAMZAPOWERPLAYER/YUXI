import {
  addDaysToKey,
  compareDayKeys,
  daysBetweenKeys,
  isValidDayKey,
  minutesFromSeconds,
  recentDayKeys,
  startOfLocalDayMs,
  toLocalDayKey,
} from '@/utils/date';

function localMs(year: number, month: number, day: number, hour = 12): number {
  return new Date(year, month - 1, day, hour, 0, 0, 0).getTime();
}

describe('local day keys', () => {
  it('formats the local calendar date with zero padding', () => {
    expect(toLocalDayKey(localMs(2026, 1, 5))).toBe('2026-01-05');
    expect(toLocalDayKey(localMs(2026, 12, 31, 23))).toBe('2026-12-31');
  });

  it('uses local midnight boundaries, not UTC', () => {
    const justBeforeMidnight = new Date(2026, 2, 9, 23, 59, 59).getTime();
    const justAfterMidnight = new Date(2026, 2, 10, 0, 0, 1).getTime();
    expect(toLocalDayKey(justBeforeMidnight)).toBe('2026-03-09');
    expect(toLocalDayKey(justAfterMidnight)).toBe('2026-03-10');
  });

  it('validates real calendar dates', () => {
    expect(isValidDayKey('2026-02-28')).toBe(true);
    expect(isValidDayKey('2024-02-29')).toBe(true);
    expect(isValidDayKey('2026-02-29')).toBe(false);
    expect(isValidDayKey('2026-13-01')).toBe(false);
    expect(isValidDayKey('2026-04-31')).toBe(false);
    expect(isValidDayKey('26-01-01')).toBe(false);
    expect(isValidDayKey('2026-1-1')).toBe(false);
  });

  it('finds local midnight for a key', () => {
    const midnight = new Date(startOfLocalDayMs('2026-06-15'));
    expect(midnight.getFullYear()).toBe(2026);
    expect(midnight.getMonth()).toBe(5);
    expect(midnight.getDate()).toBe(15);
    expect(midnight.getHours()).toBe(0);
    expect(midnight.getMinutes()).toBe(0);
  });

  it('adds days across month, year and leap boundaries', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToKey('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToKey('2026-01-10', 0)).toBe('2026-01-10');
  });

  it('counts calendar days independent of DST', () => {
    expect(daysBetweenKeys('2026-01-01', '2026-01-01')).toBe(0);
    expect(daysBetweenKeys('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetweenKeys('2026-01-02', '2026-01-01')).toBe(-1);
    expect(daysBetweenKeys('2026-03-07', '2026-03-09')).toBe(2);
    expect(daysBetweenKeys('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('compares and lists day keys', () => {
    expect(compareDayKeys('2026-01-01', '2026-01-02')).toBe(-1);
    expect(compareDayKeys('2026-02-01', '2026-01-02')).toBe(1);
    expect(compareDayKeys('2026-01-02', '2026-01-02')).toBe(0);
    expect(recentDayKeys('2026-01-03', 3)).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    expect(recentDayKeys('2026-01-03', 0)).toEqual([]);
  });

  it('rejects invalid keys when manipulating them', () => {
    expect(() => addDaysToKey('not-a-day', 1)).toThrow(/Invalid day key/);
    expect(() => startOfLocalDayMs('2026-02-30')).toThrow(/Invalid day key/);
  });

  it('converts seconds to whole minutes', () => {
    expect(minutesFromSeconds(0)).toBe(0);
    expect(minutesFromSeconds(59)).toBe(0);
    expect(minutesFromSeconds(60)).toBe(1);
    expect(minutesFromSeconds(3599)).toBe(59);
    expect(minutesFromSeconds(-10)).toBe(0);
    expect(minutesFromSeconds(Number.NaN)).toBe(0);
  });
});
