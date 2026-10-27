import { xpForAnswer, xpForCompletedSession } from '@/features/progress/xp';
import { qualityFromAnswer } from '@/features/srs/sm2';
import type { QuizAnswer, QuizQuestion, QuizScore, QuizSession } from '@/types/quiz';

export function startQuizSession(
  questions: readonly QuizQuestion[],
  startedAt: number,
): QuizSession {
  return {
    questions: [...questions],
    answers: [],
    index: 0,
    startedAt,
  };
}

export function currentQuestion(session: QuizSession): QuizQuestion | null {
  return session.questions[session.index] ?? null;
}

export function isSessionComplete(session: QuizSession): boolean {
  return session.answers.length >= session.questions.length;
}

export function isQuestionAnswered(session: QuizSession): boolean {
  const question = currentQuestion(session);
  if (!question) return false;
  return session.answers.some((answer) => answer.questionId === question.id);
}

export type AnswerInput = {
  /** Question the tap belonged to; stale taps after advancing are ignored. */
  questionId: string;
  selectedOptionId: string | null;
  responseMs: number;
  nowMs: number;
};

/**
 * Grades the current question and advances. Answering twice is a no-op so a
 * double tap cannot award XP twice.
 */
export function answerCurrent(session: QuizSession, input: AnswerInput): QuizSession {
  const question = currentQuestion(session);
  if (!question) return session;
  // A double tap can arrive after the index advanced to the next card. Compare
  // the submitted question id so the stale tap is ignored rather than graded.
  if (question.id !== input.questionId) return session;
  if (session.answers.some((answer) => answer.questionId === question.id)) return session;

  const selected = input.selectedOptionId;
  const correct = selected !== null && selected === question.correctOptionId;
  const responseMs = Number.isFinite(input.responseMs)
    ? Math.max(0, Math.round(input.responseMs))
    : 0;
  const answer: QuizAnswer = {
    questionId: question.id,
    selectedOptionId: selected,
    correct,
    responseMs,
    at: input.nowMs,
    quality: qualityFromAnswer({ correct, responseMs }),
    xp: xpForAnswer(correct),
  };

  return {
    ...session,
    answers: [...session.answers, answer],
    index: session.index + 1,
  };
}

/** Ends a session early without inventing answers for the remaining questions. */
export function abandonSession(session: QuizSession): QuizSession {
  return { ...session, index: session.questions.length };
}

export function scoreSession(session: QuizSession): QuizScore {
  const correct = session.answers.filter((answer) => answer.correct).length;
  const answered = session.answers.length;
  const finished = isSessionComplete(session);
  const answerXp = session.answers.reduce((sum, answer) => sum + answer.xp, 0);

  return {
    answered,
    correct,
    total: session.questions.length,
    accuracy: answered === 0 ? 0 : correct / answered,
    xp: answerXp + (finished && answered > 0 ? xpForCompletedSession(session.questions.length) : 0),
    finished,
  };
}

/** Duration from the first to the last answer, clamped to a non-negative value. */
export function sessionDurationMs(session: QuizSession): number {
  const first = session.answers[0];
  const last = session.answers[session.answers.length - 1];
  if (!first || !last) return 0;
  return Math.max(0, last.at - first.at);
}
