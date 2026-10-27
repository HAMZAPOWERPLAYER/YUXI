/**
 * Seedable randomness. All app randomness flows through this module so quiz
 * selection and tests are reproducible.
 */

export type Rng = () => number;

/** Mulberry32: small, fast, deterministic 32-bit PRNG. */
export function createRng(seed: number): Rng {
  let state = Math.trunc(seed) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function randomInt(rng: Rng, maxExclusive: number): number {
  if (!Number.isFinite(maxExclusive) || maxExclusive <= 0) return 0;
  return Math.floor(rng() * Math.trunc(maxExclusive));
}

/** Returns a shuffled copy; the input is never mutated. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, index + 1);
    const current = result[index];
    const target = result[swapIndex];
    if (current !== undefined && target !== undefined) {
      result[index] = target;
      result[swapIndex] = current;
    }
  }
  return result;
}

export function pickOne<T>(items: readonly T[], rng: Rng): T | undefined {
  if (items.length === 0) return undefined;
  return items[randomInt(rng, items.length)];
}

/** Chooses one item proportionally to a non-negative weight. */
export function weightedPick<T>(
  items: readonly T[],
  weight: (item: T) => number,
  rng: Rng,
): T | undefined {
  if (items.length === 0) return undefined;
  const weights = items.map((item) => {
    const value = weight(item);
    return Number.isFinite(value) && value > 0 ? value : 0;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return items[randomInt(rng, items.length)];

  let ticket = rng() * total;
  for (let index = 0; index < items.length; index += 1) {
    const currentWeight = weights[index] ?? 0;
    if (currentWeight <= 0) continue;
    ticket -= currentWeight;
    if (ticket < 0) return items[index];
  }
  return items[items.length - 1];
}

/** Weighted sampling without replacement. */
export function weightedSample<T>(
  items: readonly T[],
  count: number,
  weight: (item: T) => number,
  rng: Rng,
): T[] {
  const remaining = [...items];
  const picked: T[] = [];
  const target = Math.max(0, Math.min(Math.trunc(count), remaining.length));

  while (picked.length < target) {
    const item = weightedPick(remaining, weight, rng);
    if (item === undefined) break;
    picked.push(item);
    const index = remaining.indexOf(item);
    if (index === -1) break;
    remaining.splice(index, 1);
  }

  return picked;
}
