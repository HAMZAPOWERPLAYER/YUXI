import {
  createRng,
  pickOne,
  randomInt,
  shuffle,
  weightedPick,
  weightedSample,
} from '@/utils/random';

describe('seeded random', () => {
  it('is deterministic for the same seed and differs across seeds', () => {
    const a = createRng(42);
    const b = createRng(42);
    const c = createRng(43);
    const first = [a(), a(), a(), a()];
    expect([b(), b(), b(), b()]).toEqual(first);
    expect([c(), c(), c(), c()]).not.toEqual(first);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('normalizes negative and float seeds to a stable uint32', () => {
    const a = createRng(-5);
    const b = createRng(-5);
    expect(a()).toBe(b());
  });

  it('returns integers inside the requested range', () => {
    const rng = createRng(7);
    for (let index = 0; index < 100; index += 1) {
      const value = randomInt(rng, 5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
    }
  });

  it('handles invalid or empty ranges', () => {
    const rng = createRng(1);
    expect(randomInt(rng, 0)).toBe(0);
    expect(randomInt(rng, -3)).toBe(0);
    expect(randomInt(rng, Number.NaN)).toBe(0);
  });
});

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const copy = [...input];
    const result = shuffle(input, createRng(99));
    expect(input).toEqual(copy);
    expect(result).not.toBe(input);
    expect([...result].sort()).toEqual([...input].sort());
  });

  it('is deterministic for a seed', () => {
    const input = 'abcdefgh'.split('');
    expect(shuffle(input, createRng(3))).toEqual(shuffle(input, createRng(3)));
  });

  it('handles empty and single-item inputs', () => {
    expect(shuffle([], createRng(1))).toEqual([]);
    expect(shuffle(['a'], createRng(1))).toEqual(['a']);
  });
});

describe('weighted picking', () => {
  it('picks from a non-empty list and returns undefined for an empty one', () => {
    expect(pickOne([], createRng(1))).toBeUndefined();
    expect(['a', 'b', 'c']).toContain(pickOne(['a', 'b', 'c'], createRng(1)));
  });

  it('respects a single positive weight', () => {
    const items = ['never', 'always', 'never-again'];
    for (let seed = 0; seed < 20; seed += 1) {
      const picked = weightedPick(items, (item) => (item === 'always' ? 1 : 0), createRng(seed));
      expect(picked).toBe('always');
    }
  });

  it('falls back to a uniform pick when all weights are zero or invalid', () => {
    const items = ['a', 'b'];
    expect(items).toContain(weightedPick(items, () => 0, createRng(2)));
    expect(items).toContain(weightedPick(items, () => Number.NaN, createRng(2)));
    expect(weightedPick([], () => 1, createRng(2))).toBeUndefined();
  });

  it('favours heavier items over many seeds', () => {
    let heavy = 0;
    for (let seed = 0; seed < 200; seed += 1) {
      const picked = weightedPick(
        ['heavy', 'light'],
        (item) => (item === 'heavy' ? 9 : 1),
        createRng(seed),
      );
      if (picked === 'heavy') heavy += 1;
    }
    expect(heavy).toBeGreaterThan(130);
  });
});

describe('weightedSample', () => {
  it('samples without replacement', () => {
    const items = [1, 2, 3, 4, 5];
    const picked = weightedSample(items, 3, () => 1, createRng(11));
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it('clamps the count to the input size and handles zero', () => {
    expect(weightedSample([1, 2], 10, () => 1, createRng(1))).toHaveLength(2);
    expect(weightedSample([1, 2], 0, () => 1, createRng(1))).toEqual([]);
    expect(weightedSample([], 3, () => 1, createRng(1))).toEqual([]);
  });

  it('does not mutate the source list', () => {
    const items = ['a', 'b', 'c'];
    weightedSample(items, 3, () => 1, createRng(5));
    expect(items).toEqual(['a', 'b', 'c']);
  });
});
