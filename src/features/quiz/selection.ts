import { getConfusables } from '@/features/kana/selectors';
import { MS_PER_DAY, accuracyOf } from '@/features/srs/sm2';
import type { Kana, KanaProgress, KanaReviewMode } from '@/types/kana';
import type { QuizOption, QuizQuestion } from '@/types/quiz';
import { type Rng, shuffle, weightedSample } from '@/utils/random';

export const DEFAULT_QUESTION_COUNT = 10;
export const DEFAULT_MAX_NEW = 5;
export const DEFAULT_OPTION_COUNT = 4;
export const RECENT_AVOID_COUNT = 3;

export const QUIZ_MODES: readonly KanaReviewMode[] = [
  'kana-to-romaji',
  'romaji-to-kana',
  'listening',
];

export type SelectionInput = {
  pool: readonly Kana[];
  progress: readonly KanaProgress[];
  nowMs: number;
  questionCount?: number;
  maxNew?: number;
  /** Most recently shown kana first; used to avoid an immediate repeat. */
  recentKanaIds?: readonly string[];
  rng: Rng;
};

export type QuizBuildInput = SelectionInput & {
  modes?: readonly KanaReviewMode[];
  optionCount?: number;
};

/** Weak = seen at least three times and still under 70% accuracy. */
export function isWeakProgress(progress: KanaProgress): boolean {
  return progress.seen >= 3 && accuracyOf(progress) < 0.7;
}

/** Due cards get more weight the longer they have been waiting (max 30 days). */
export function dueWeight(progress: KanaProgress, nowMs: number): number {
  const overdueDays = Math.min(30, Math.max(0, (nowMs - progress.dueAt) / MS_PER_DAY));
  return 1 + overdueDays;
}

/** Weaker cards get up to 1 + 7 extra tickets vs. a 70%-accuracy card. */
export function weakWeight(progress: KanaProgress): number {
  return 1 + Math.max(0, 0.7 - accuracyOf(progress)) * 10;
}

function kanaById(pool: readonly Kana[]): Map<string, Kana> {
  return new Map(pool.map((kana) => [kana.id, kana]));
}

function pushUnique(target: Kana[], kana: Kana | undefined, seen: Set<string>): void {
  if (!kana || seen.has(kana.id)) return;
  seen.add(kana.id);
  target.push(kana);
}

/**
 * Chooses the kana for one session: overdue reviews first (weighted by how
 * overdue), then weak cards, then at most `maxNew` new characters in learning
 * order. Remaining slots are filled from the pool so a short pool still yields
 * a full session.
 */
export function selectSessionKana(input: SelectionInput): Kana[] {
  const limit = Math.max(0, Math.trunc(input.questionCount ?? DEFAULT_QUESTION_COUNT));
  const maxNew = Math.max(0, Math.trunc(input.maxNew ?? DEFAULT_MAX_NEW));
  if (limit === 0) return [];

  const pool = [...new Map(input.pool.map((kana) => [kana.id, kana])).values()];
  const progressById = new Map(input.progress.map((item) => [item.kanaId, item]));
  const due: KanaProgress[] = [];
  const weak: KanaProgress[] = [];
  const fresh: Kana[] = [];

  for (const kana of pool) {
    const progress = progressById.get(kana.id);
    if (!progress || progress.seen === 0) {
      fresh.push(kana);
    } else if (progress.dueAt <= input.nowMs) {
      due.push(progress);
    } else if (isWeakProgress(progress)) {
      weak.push(progress);
    }
  }

  const byId = kanaById(pool);
  const selected: Kana[] = [];
  const selectedIds = new Set<string>();

  for (const progress of weightedSample(
    due,
    limit,
    (item) => dueWeight(item, input.nowMs),
    input.rng,
  )) {
    pushUnique(selected, byId.get(progress.kanaId), selectedIds);
  }

  const afterDue = Math.max(0, limit - selected.length);
  if (afterDue > 0) {
    for (const progress of weightedSample(weak, afterDue, weakWeight, input.rng)) {
      pushUnique(selected, byId.get(progress.kanaId), selectedIds);
    }
  }

  const newSlots = Math.min(maxNew, Math.max(0, limit - selected.length));
  for (const kana of fresh.slice(0, newSlots)) {
    pushUnique(selected, kana, selectedIds);
  }

  // Fill any remaining slots with already-studied cards only. New characters
  // never exceed maxNew, so a short session is preferable to overloading the
  // learner with unfamiliar items.
  if (selected.length < limit) {
    for (const kana of pool) {
      if (selected.length >= limit) break;
      const progress = progressById.get(kana.id);
      if (progress && progress.seen > 0) {
        pushUnique(selected, kana, selectedIds);
      }
    }
  }

  return avoidRecentOpening(selected, input.recentKanaIds ?? []);
}

/**
 * If the session would open with one of the last few kana, rotate a different
 * card to the front. The rest of the order is preserved.
 */
export function avoidRecentOpening(
  items: readonly Kana[],
  recentKanaIds: readonly string[],
): Kana[] {
  if (items.length <= 1) return [...items];
  const recent = new Set(recentKanaIds.slice(0, RECENT_AVOID_COUNT));
  if (!recent.has(items[0]?.id ?? '')) return [...items];

  const index = items.findIndex((kana) => !recent.has(kana.id));
  if (index <= 0) return [...items];
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)].filter(
    (kana): kana is Kana => kana !== undefined,
  );
}

/** Text displayed on an option button for a given quiz mode. */
export function optionTextFor(kana: Kana, mode: KanaReviewMode): string {
  return mode === 'kana-to-romaji' ? kana.romaji : kana.kana;
}

export function promptTextFor(kana: Kana, mode: KanaReviewMode): string {
  if (mode === 'kana-to-romaji') return kana.kana;
  if (mode === 'romaji-to-kana') return kana.romaji;
  return '';
}

/**
 * Builds four unique options for a question. Distractors prefer curated
 * look-alikes, then the same row, then the same script, then anything.
 */
export function buildOptions(
  kana: Kana,
  pool: readonly Kana[],
  mode: KanaReviewMode,
  rng: Rng,
  optionCount = DEFAULT_OPTION_COUNT,
): { options: QuizOption[]; correctIndex: number } {
  const target = Math.max(1, Math.trunc(optionCount));
  const correctText = optionTextFor(kana, mode);
  const poolIds = new Set(pool.map((item) => item.id));
  const usedIds = new Set<string>([kana.id]);
  const usedTexts = new Set<string>([correctText]);
  const distractors: QuizOption[] = [];

  const confusables = getConfusables(kana).filter((item) => poolIds.has(item.id));
  const sameRow = pool.filter((item) => item.row === kana.row);
  const sameScript = pool.filter((item) => item.script === kana.script);
  const tiers = [confusables, sameRow, sameScript, pool];

  for (const tier of tiers) {
    if (distractors.length >= target - 1) break;
    for (const candidate of shuffle(tier, rng)) {
      if (distractors.length >= target - 1) break;
      if (usedIds.has(candidate.id)) continue;
      const text = optionTextFor(candidate, mode);
      if (usedTexts.has(text)) continue;
      usedIds.add(candidate.id);
      usedTexts.add(text);
      distractors.push({ kanaId: candidate.id, text });
    }
  }

  const options = shuffle([{ kanaId: kana.id, text: correctText }, ...distractors], rng);
  return {
    options,
    correctIndex: Math.max(
      0,
      options.findIndex((option) => option.kanaId === kana.id && option.text === correctText),
    ),
  };
}

export function buildQuestion(
  kana: Kana,
  mode: KanaReviewMode,
  pool: readonly Kana[],
  rng: Rng,
  index: number,
  optionCount = DEFAULT_OPTION_COUNT,
): QuizQuestion {
  const { options, correctIndex } = buildOptions(kana, pool, mode, rng, optionCount);
  const correct = options[correctIndex];
  return {
    id: `q${index}-${kana.id}-${mode}`,
    kana,
    mode,
    prompt: promptTextFor(kana, mode),
    answer: optionTextFor(kana, mode),
    options,
    correctOptionId: correct?.kanaId ?? kana.id,
  };
}

/** Full question list for a session; modes rotate so every session is mixed. */
export function buildQuizQuestions(input: QuizBuildInput): QuizQuestion[] {
  const kanaList = selectSessionKana(input);
  const modes = input.modes && input.modes.length > 0 ? [...input.modes] : [...QUIZ_MODES];
  const rotated = shuffle(modes, input.rng);
  const optionCount = Math.max(2, Math.trunc(input.optionCount ?? DEFAULT_OPTION_COUNT));

  return kanaList.map((kana, index) => {
    const mode = rotated[index % rotated.length] ?? 'kana-to-romaji';
    return buildQuestion(kana, mode, input.pool, input.rng, index, optionCount);
  });
}
