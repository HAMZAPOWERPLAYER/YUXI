/** Clamps any numeric input to 0–1. Non-finite values become 0. */
export function clampProgress(progress: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
}
