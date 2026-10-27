import { isClockOverridden, now, setClockForTests, todayKey } from '@/services/clock';

describe('clock service', () => {
  afterEach(() => {
    setClockForTests(null);
  });

  it('uses the real clock by default', () => {
    expect(isClockOverridden()).toBe(false);
    expect(Math.abs(now() - Date.now())).toBeLessThan(5_000);
  });

  it('freezes time for tests', () => {
    const fixed = new Date(2026, 4, 20, 9, 30).getTime();
    setClockForTests(fixed);
    expect(isClockOverridden()).toBe(true);
    expect(now()).toBe(fixed);
    expect(todayKey()).toBe('2026-05-20');
  });

  it('derives the local day key from a supplied timestamp', () => {
    expect(todayKey(new Date(2026, 11, 31, 23, 59).getTime())).toBe('2026-12-31');
    expect(todayKey(new Date(2027, 0, 1, 0, 1).getTime())).toBe('2027-01-01');
  });

  it('restores the real clock when reset', () => {
    setClockForTests(1_000);
    expect(now()).toBe(1_000);
    setClockForTests(null);
    expect(isClockOverridden()).toBe(false);
    expect(now()).toBeGreaterThan(1_000);
  });
});
