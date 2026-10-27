import { getAllKanaProgress, getRecentReviewLog } from '@/db/repositories';
import type { DatabaseConnection } from '@/db/types';
import { getAllKana, getById } from '@/features/kana/selectors';
import { hasJapaneseVoice } from '@/services/tts';
import type { KanaGroup, KanaScript, ReviewMode } from '@/types/kana';
import type { QuizQuestion } from '@/types/quiz';
import { createRng } from '@/utils/random';

import { QUIZ_MODES, buildQuestion, buildQuizQuestions } from './selection';

export type ScriptChoice = KanaScript | 'both';
export type ModeChoice = ReviewMode | 'mixed';

export type QuizRequest = {
  mode: ModeChoice;
  script: ScriptChoice;
  group: KanaGroup | null;
  length: number;
  /** When set, the session is a single focused review of this kana. */
  kanaId?: string;
};

export type PreparedQuiz = {
  questions: QuizQuestion[];
  voiceAvailable: boolean;
  seenBefore: Set<string>;
};

export function parseMode(value: string | undefined): ModeChoice {
  return value === 'kana-to-romaji' || value === 'romaji-to-kana' || value === 'listening'
    ? value
    : 'mixed';
}

export function parseScript(value: string | undefined): ScriptChoice {
  return value === 'hiragana' || value === 'katakana' ? value : 'both';
}

export function parseGroup(value: string | undefined): KanaGroup | null {
  return value === 'basic' || value === 'dakuten' || value === 'yoon' ? value : null;
}

export function parseLength(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(30, Math.max(1, Math.trunc(parsed)));
}

/**
 * Reads the SRS state and builds the question list for a session. Kept out of
 * the screen so the screen only coordinates UI state and persistence.
 */
export async function prepareQuiz(
  db: DatabaseConnection,
  request: QuizRequest,
  nowMs: number,
): Promise<PreparedQuiz> {
  const [allProgress, recent, voiceAvailable] = await Promise.all([
    getAllKanaProgress(db),
    getRecentReviewLog(db, 5),
    hasJapaneseVoice(),
  ]);

  const focus = request.kanaId ? getById(request.kanaId) : undefined;
  if (request.kanaId && !focus) throw new Error('Unknown kana');

  let questions: QuizQuestion[];
  if (focus) {
    const scriptPool = getAllKana().filter((kana) => kana.script === focus.script);
    const focusMode: ReviewMode = request.mode === 'mixed' ? 'kana-to-romaji' : request.mode;
    const rng = createRng(nowMs);
    questions = [buildQuestion(focus, focusMode, scriptPool, rng, 0)];
  } else {
    const pool = getAllKana().filter(
      (kana) =>
        (request.script === 'both' || kana.script === request.script) &&
        (!request.group || kana.group === request.group),
    );
    const modes: ReviewMode[] =
      request.mode === 'mixed'
        ? voiceAvailable
          ? [...QUIZ_MODES]
          : QUIZ_MODES.filter((mode) => mode !== 'listening')
        : [request.mode];
    questions = buildQuizQuestions({
      modes,
      nowMs,
      pool,
      progress: allProgress,
      questionCount: request.length,
      recentKanaIds: recent.map((entry) => entry.kanaId),
      rng: createRng(nowMs),
    });
  }

  if (questions.length === 0) throw new Error('No questions available');

  return {
    questions,
    voiceAvailable,
    seenBefore: new Set(allProgress.filter((item) => item.seen > 0).map((item) => item.kanaId)),
  };
}
