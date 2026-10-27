/** XP awards. Kept in one place so the UI, stats and backup agree. */
export const XP_PER_CORRECT = 10;
export const XP_PER_WRONG = 2;
export const XP_SESSION_BONUS = 20;
export const XP_PER_LEVEL = 200;

/** XP for a single answer. Wrong answers still earn a little effort XP. */
export function xpForAnswer(correct: boolean): number {
  return correct ? XP_PER_CORRECT : XP_PER_WRONG;
}

/** Bonus granted once a session is completed, independent of accuracy. */
export function xpForCompletedSession(questionCount: number): number {
  return questionCount > 0 ? XP_SESSION_BONUS : 0;
}

export type LevelInfo = {
  level: number;
  /** XP earned inside the current level. */
  xpIntoLevel: number;
  /** XP needed to advance from the current level. */
  xpForNextLevel: number;
  /** 0–1 progress toward the next level. */
  progress: number;
  totalXp: number;
};

function safeXp(totalXp: number): number {
  return Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
}

/** Flat 200 XP per level. Level 1 starts at 0 XP. */
export function levelForXp(totalXp: number): LevelInfo {
  const xp = safeXp(totalXp);
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp % XP_PER_LEVEL;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL,
    progress: xpIntoLevel / XP_PER_LEVEL,
    totalXp: xp,
  };
}

/** Adds XP with a non-negative guard, used when batching session results. */
export function addXp(current: number, delta: number): number {
  const base = safeXp(current);
  if (!Number.isFinite(delta) || delta <= 0) return base;
  return base + Math.floor(delta);
}
