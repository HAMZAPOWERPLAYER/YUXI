import {
  QUIZ_MODES,
  avoidRecentOpening,
  buildOptions,
  buildQuestion,
  buildQuizQuestions,
  dueWeight,
  isWeakProgress,
  optionTextFor,
  promptTextFor,
  selectSessionKana,
  weakWeight,
} from '@/features/quiz';
import { getById, getByScript, getRow } from '@/features/kana';
import { MS_PER_DAY } from '@/features/srs';
import type { Kana, KanaProgress } from '@/types/kana';
import { createRng } from '@/utils/random';

const NOW = 1_700_000_000_000;
const hiragana = getByScript('hiragana');

function progress(kanaId: string, overrides: Partial<KanaProgress> = {}): KanaProgress {
  return {
    kanaId,
    seen: 5,
    correct: 4,
    wrong: 1,
    streak: 1,
    ease: 2.5,
    intervalDays: 3,
    repetitions: 2,
    dueAt: NOW + MS_PER_DAY,
    lastSeenAt: NOW - MS_PER_DAY,
    firstSeenAt: NOW - 10 * MS_PER_DAY,
    lapses: 0,
    ...overrides,
  };
}

function ids(kana: readonly Kana[]): string[] {
  return kana.map((item) => item.id);
}

describe('weak and due weights', () => {
  it('flags cards seen at least three times under 70% accuracy', () => {
    expect(isWeakProgress(progress('a', { seen: 3, correct: 2 }))).toBe(true);
    expect(isWeakProgress(progress('a', { seen: 2, correct: 0 }))).toBe(false);
    expect(isWeakProgress(progress('a', { seen: 3, correct: 3 }))).toBe(false);
    expect(isWeakProgress(progress('a', { seen: 10, correct: 7 }))).toBe(false);
  });

  it('increases due weight with overdue days up to 30', () => {
    expect(dueWeight(progress('a', { dueAt: NOW }), NOW)).toBe(1);
    expect(dueWeight(progress('a', { dueAt: NOW - MS_PER_DAY / 2 }), NOW)).toBeCloseTo(1.5, 5);
    expect(dueWeight(progress('a', { dueAt: NOW - 10 * MS_PER_DAY }), NOW)).toBe(11);
    expect(dueWeight(progress('a', { dueAt: NOW - 90 * MS_PER_DAY }), NOW)).toBe(31);
  });

  it('weights weaker cards more heavily', () => {
    const weakest = weakWeight(progress('a', { seen: 10, correct: 0 }));
    const borderline = weakWeight(progress('a', { seen: 10, correct: 6 }));
    const strong = weakWeight(progress('a', { seen: 10, correct: 10 }));
    expect(weakest).toBeGreaterThan(borderline);
    expect(borderline).toBeGreaterThan(strong);
    expect(strong).toBe(1);
  });
});

describe('selectSessionKana', () => {
  it('caps brand-new characters at maxNew and keeps learning order', () => {
    const pool = hiragana.slice(0, 20);
    const selected = selectSessionKana({
      pool,
      progress: [],
      nowMs: NOW,
      questionCount: 10,
      maxNew: 5,
      rng: createRng(1),
    });
    expect(selected).toHaveLength(5);
    expect(ids(selected)).toEqual(ids(pool.slice(0, 5)));
  });

  it('prefers due reviews over new characters', () => {
    const pool = hiragana.slice(0, 10);
    const dueIds = [pool[2]?.id ?? '', pool[5]?.id ?? '', pool[7]?.id ?? ''];
    const selected = selectSessionKana({
      pool,
      progress: dueIds.map((kanaId) => progress(kanaId, { dueAt: NOW - MS_PER_DAY })),
      nowMs: NOW,
      questionCount: 2,
      maxNew: 5,
      rng: createRng(2),
    });
    expect(selected).toHaveLength(2);
    expect(dueIds).toContain(selected[0]?.id);
    expect(dueIds).toContain(selected[1]?.id);
  });

  it('falls back to weak cards when nothing is due', () => {
    const pool = hiragana.slice(0, 10);
    const weakIds = [pool[1]?.id ?? '', pool[3]?.id ?? ''];
    const selected = selectSessionKana({
      pool,
      progress: weakIds.map((kanaId) =>
        progress(kanaId, { seen: 6, correct: 2, dueAt: NOW + MS_PER_DAY }),
      ),
      nowMs: NOW,
      questionCount: 2,
      maxNew: 5,
      rng: createRng(3),
    });
    expect(ids(selected).sort()).toEqual([...weakIds].sort());
  });

  it('orders due before weak before new', () => {
    const pool = hiragana.slice(0, 6);
    const dueId = pool[0]?.id ?? '';
    const weakId = pool[1]?.id ?? '';
    const freshIds = ids(pool.slice(2));

    const selected = selectSessionKana({
      pool,
      progress: [
        progress(dueId, { dueAt: NOW - MS_PER_DAY }),
        progress(weakId, { seen: 5, correct: 1, dueAt: NOW + MS_PER_DAY }),
      ],
      nowMs: NOW,
      questionCount: 4,
      maxNew: 1,
      rng: createRng(4),
    });

    expect(selected[0]?.id).toBe(dueId);
    expect(selected[1]?.id).toBe(weakId);
    expect(selected).toHaveLength(3);
    expect(freshIds).toContain(selected[2]?.id);
  });

  it('fills spare slots with already-studied cards, never extra new ones', () => {
    const pool = hiragana.slice(0, 5);
    const learnedId = pool[0]?.id ?? '';
    const selected = selectSessionKana({
      pool,
      progress: [progress(learnedId, { dueAt: NOW + MS_PER_DAY, seen: 4, correct: 3 })],
      nowMs: NOW,
      questionCount: 10,
      maxNew: 2,
      rng: createRng(5),
    });
    expect(selected).toHaveLength(3);
    expect(ids(selected)).toContain(learnedId);
    expect(ids(selected)).toEqual(expect.arrayContaining(ids(pool.slice(1, 3))));
  });

  it('returns an empty list for zero questions or maxNew 0 with no studied cards', () => {
    expect(
      selectSessionKana({
        pool: hiragana.slice(0, 5),
        progress: [],
        nowMs: NOW,
        questionCount: 0,
        rng: createRng(1),
      }),
    ).toEqual([]);
    expect(
      selectSessionKana({
        pool: hiragana.slice(0, 5),
        progress: [],
        nowMs: NOW,
        questionCount: 5,
        maxNew: 0,
        rng: createRng(1),
      }),
    ).toEqual([]);
  });

  it('deduplicates the pool and handles an empty pool', () => {
    const pool = hiragana.slice(0, 3);
    const selected = selectSessionKana({
      pool: [...pool, ...pool],
      progress: [],
      nowMs: NOW,
      questionCount: 10,
      maxNew: 5,
      rng: createRng(6),
    });
    expect(new Set(ids(selected)).size).toBe(selected.length);
    expect(selectSessionKana({ pool: [], progress: [], nowMs: NOW, rng: createRng(1) })).toEqual(
      [],
    );
  });

  it('rotates a recently seen kana away from the opening question', () => {
    const items = hiragana.slice(0, 4);
    const recent = [items[0]?.id ?? '', items[1]?.id ?? ''];
    expect(ids(avoidRecentOpening(items, recent))).toEqual([
      items[2]?.id,
      items[0]?.id,
      items[1]?.id,
      items[3]?.id,
    ]);
    const three = items.slice(0, 3);
    expect(
      ids(
        avoidRecentOpening(
          three,
          three.map((item) => item.id),
        ),
      ),
    ).toEqual(ids(three));
    expect(avoidRecentOpening([], recent)).toEqual([]);
    expect(ids(avoidRecentOpening(items.slice(0, 1), [items[0]?.id ?? '']))).toEqual([
      items[0]?.id,
    ]);
  });

  it('is deterministic for a seed', () => {
    const pool = hiragana.slice(0, 30);
    const progressRows = pool
      .slice(0, 8)
      .map((kana) => progress(kana.id, { dueAt: NOW - MS_PER_DAY }));
    const config = {
      pool,
      progress: progressRows,
      nowMs: NOW,
      questionCount: 10,
      maxNew: 3,
      rng: createRng(77),
    };
    expect(ids(selectSessionKana(config))).toEqual(
      ids(selectSessionKana({ ...config, rng: createRng(77) })),
    );
  });
});

describe('option building', () => {
  it('maps prompt and option text per mode', () => {
    const kana = getById('hiragana-a');
    expect(kana).toBeDefined();
    if (!kana) return;
    expect(optionTextFor(kana, 'kana-to-romaji')).toBe('a');
    expect(optionTextFor(kana, 'romaji-to-kana')).toBe('あ');
    expect(optionTextFor(kana, 'listening')).toBe('あ');
    expect(promptTextFor(kana, 'kana-to-romaji')).toBe('あ');
    expect(promptTextFor(kana, 'romaji-to-kana')).toBe('a');
    expect(promptTextFor(kana, 'listening')).toBe('');
  });

  it('builds four unique options that include the correct answer', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const kana = hiragana[seed * 4] ?? hiragana[0];
      if (!kana) continue;
      const { options, correctIndex } = buildOptions(
        kana,
        hiragana,
        'kana-to-romaji',
        createRng(seed),
      );
      expect(options).toHaveLength(4);
      expect(new Set(options.map((option) => option.text)).size).toBe(4);
      expect(options.some((option) => option.kanaId === kana.id)).toBe(true);
      expect(options[correctIndex]?.kanaId).toBe(kana.id);
      expect(options[correctIndex]?.text).toBe(kana.romaji);
    }
  });

  it('prefers curated look-alikes as distractors', () => {
    const nu = getById('hiragana-nu');
    expect(nu).toBeDefined();
    if (!nu) return;
    const { options } = buildOptions(nu, hiragana, 'kana-to-romaji', createRng(8), 2);
    expect(options.map((option) => option.text).sort()).toEqual(['me', 'nu']);
  });

  it('falls back to the same row when there is no confusable', () => {
    const ka = getById('hiragana-ka');
    expect(ka).toBeDefined();
    if (!ka) return;
    const rowRomaji = getRow('hiragana', 'k').map((kana) => kana.romaji);
    const { options } = buildOptions(ka, hiragana, 'kana-to-romaji', createRng(9), 2);
    const distractor = options.find((option) => option.kanaId !== ka.id);
    expect(rowRomaji).toContain(distractor?.text);
  });

  it('deduplicates option text across scripts', () => {
    const a = getById('hiragana-a');
    expect(a).toBeDefined();
    if (!a) return;
    const { options } = buildOptions(
      a,
      getByScript('hiragana').concat(getByScript('katakana')),
      'kana-to-romaji',
      createRng(10),
    );
    expect(new Set(options.map((option) => option.text)).size).toBe(options.length);
  });

  it('returns fewer options when the pool is too small', () => {
    const pool = hiragana.slice(0, 2);
    const kana = pool[0];
    if (!kana) return;
    const { options } = buildOptions(kana, pool, 'romaji-to-kana', createRng(11), 4);
    expect(options).toHaveLength(2);
    expect(new Set(options.map((option) => option.text)).size).toBe(2);
  });

  it('randomizes the correct position across seeds', () => {
    const kana = getById('hiragana-ka');
    if (!kana) return;
    const positions = new Set<number>();
    for (let seed = 0; seed < 40; seed += 1) {
      positions.add(buildOptions(kana, hiragana, 'kana-to-romaji', createRng(seed)).correctIndex);
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('buildQuestion and buildQuizQuestions', () => {
  it('builds a question with mode-specific prompt, answer and id', () => {
    const kana = getById('hiragana-ki');
    if (!kana) return;
    const question = buildQuestion(kana, 'romaji-to-kana', hiragana, createRng(1), 3);
    expect(question.id).toBe('q3-hiragana-ki-romaji-to-kana');
    expect(question.mode).toBe('romaji-to-kana');
    expect(question.prompt).toBe('ki');
    expect(question.answer).toBe('き');
    expect(question.correctOptionId).toBe('hiragana-ki');
    expect(question.options).toHaveLength(4);
    expect(question.options.map((option) => option.kanaId)).toContain('hiragana-ki');
  });

  it('builds a session with rotating modes and unique ids', () => {
    const pool = hiragana.slice(0, 12);
    const questions = buildQuizQuestions({
      pool,
      progress: [],
      nowMs: NOW,
      questionCount: 6,
      maxNew: 6,
      modes: QUIZ_MODES,
      rng: createRng(12),
    });

    expect(questions).toHaveLength(6);
    expect(new Set(questions.map((question) => question.id)).size).toBe(6);
    expect(new Set(questions.map((question) => question.mode)).size).toBe(3);
    for (const question of questions) {
      expect(question.options).toHaveLength(4);
      expect(
        question.options[question.options.findIndex((o) => o.kanaId === question.kana.id)],
      ).toBeDefined();
    }
  });

  it('respects a single requested mode', () => {
    const questions = buildQuizQuestions({
      pool: hiragana.slice(0, 5),
      progress: [],
      nowMs: NOW,
      questionCount: 4,
      maxNew: 4,
      modes: ['listening'],
      rng: createRng(13),
    });
    expect(questions.every((question) => question.mode === 'listening')).toBe(true);
    expect(questions.every((question) => question.prompt === '')).toBe(true);
  });

  it('is deterministic for a given seed', () => {
    const config = {
      pool: hiragana.slice(0, 15),
      progress: [],
      nowMs: NOW,
      questionCount: 5,
      maxNew: 5,
      rng: createRng(21),
    };
    expect(buildQuizQuestions(config)).toEqual(
      buildQuizQuestions({ ...config, rng: createRng(21) }),
    );
  });
});
