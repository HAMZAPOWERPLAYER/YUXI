import type { Kana, KanaReviewMode } from './kana';

export type QuizOption = {
  kanaId: string;
  /** Text shown on the button for this question's mode. */
  text: string;
};

export type QuizQuestion = {
  id: string;
  kana: Kana;
  mode: KanaReviewMode;
  /** Text/audio prompt. Empty for listening (the prompt is spoken). */
  prompt: string;
  /** Canonical answer text, also used for accessibility. */
  answer: string;
  options: QuizOption[];
  correctOptionId: string;
};

export type QuizAnswer = {
  questionId: string;
  /** null when the user skipped / ran out of time. */
  selectedOptionId: string | null;
  correct: boolean;
  responseMs: number;
  at: number;
  quality: number;
  xp: number;
};

export type QuizSession = {
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  index: number;
  startedAt: number;
};

export type QuizScore = {
  answered: number;
  correct: number;
  total: number;
  accuracy: number;
  xp: number;
  finished: boolean;
};
