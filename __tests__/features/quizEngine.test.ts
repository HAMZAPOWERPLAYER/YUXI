import {
  abandonSession,
  answerCurrent,
  currentQuestion,
  isQuestionAnswered,
  isSessionComplete,
  scoreSession,
  sessionDurationMs,
  startQuizSession,
} from '@/features/quiz';
import { XP_PER_CORRECT, XP_PER_WRONG, XP_SESSION_BONUS } from '@/features/progress';
import type { QuizOption, QuizQuestion } from '@/types/quiz';

const NOW = 1_700_000_000_000;

function question(index: number): QuizQuestion {
  const options: QuizOption[] = [
    { kanaId: `kana-${index}-a`, text: 'a' },
    { kanaId: `kana-${index}-b`, text: 'b' },
  ];
  return {
    id: `q${index}`,
    kana: {
      id: `kana-${index}`,
      script: 'hiragana',
      kana: 'あ',
      romaji: 'a',
      row: 'vowels',
      group: 'basic',
      urduHint: 'ا',
      ttsText: 'あ',
    },
    mode: 'kana-to-romaji',
    prompt: 'あ',
    answer: 'a',
    options,
    correctOptionId: options[0]?.kanaId ?? '',
  };
}

describe('quiz session engine', () => {
  it('starts at the first question', () => {
    const session = startQuizSession([question(0), question(1)], NOW);
    expect(session.index).toBe(0);
    expect(session.answers).toEqual([]);
    expect(currentQuestion(session)?.id).toBe('q0');
    expect(isSessionComplete(session)).toBe(false);
    expect(isQuestionAnswered(session)).toBe(false);
  });

  it('grades a correct answer, records quality/XP and advances', () => {
    const session = startQuizSession([question(0), question(1)], NOW);
    const correctId = question(0).correctOptionId;
    const after = answerCurrent(session, {
      questionId: 'q0',
      selectedOptionId: correctId,
      responseMs: 1_000,
      nowMs: NOW + 1_000,
    });

    expect(after.answers).toHaveLength(1);
    expect(after.answers[0]).toMatchObject({
      questionId: 'q0',
      correct: true,
      quality: 5,
      xp: XP_PER_CORRECT,
      responseMs: 1_000,
      at: NOW + 1_000,
    });
    expect(after.index).toBe(1);
    expect(currentQuestion(after)?.id).toBe('q1');
    expect(isQuestionAnswered(after)).toBe(false);
  });

  it('grades a wrong answer and a skip as failures', () => {
    const wrong = answerCurrent(startQuizSession([question(0)], NOW), {
      questionId: 'q0',
      selectedOptionId: 'nope',
      responseMs: 4_000,
      nowMs: NOW,
    });
    expect(wrong.answers[0]?.correct).toBe(false);
    expect(wrong.answers[0]?.xp).toBe(XP_PER_WRONG);
    expect(wrong.answers[0]?.quality).toBe(1);

    const skipped = answerCurrent(startQuizSession([question(0)], NOW), {
      questionId: 'q0',
      selectedOptionId: null,
      responseMs: 0,
      nowMs: NOW,
    });
    expect(skipped.answers[0]?.selectedOptionId).toBeNull();
    expect(skipped.answers[0]?.correct).toBe(false);
  });

  it('ignores a stale double tap after the index advanced', () => {
    const session = startQuizSession([question(0), question(1)], NOW);
    const first = answerCurrent(session, {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW,
    });
    const second = answerCurrent(first, {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW + 100,
    });
    expect(second).toBe(first);
    expect(second.answers).toHaveLength(1);
    expect(second.index).toBe(1);
  });

  it('does nothing once the session is finished', () => {
    const session = answerCurrent(startQuizSession([question(0)], NOW), {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW,
    });
    expect(currentQuestion(session)).toBeNull();
    expect(
      answerCurrent(session, {
        questionId: 'q0',
        selectedOptionId: 'x',
        responseMs: 1,
        nowMs: NOW,
      }),
    ).toBe(session);
  });

  it('scores a finished session with the completion bonus', () => {
    let session = startQuizSession([question(0), question(1)], NOW);
    session = answerCurrent(session, {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW,
    });
    session = answerCurrent(session, {
      questionId: 'q1',
      selectedOptionId: 'wrong',
      responseMs: 3_000,
      nowMs: NOW + 2_000,
    });

    expect(isSessionComplete(session)).toBe(true);
    expect(scoreSession(session)).toEqual({
      answered: 2,
      correct: 1,
      total: 2,
      accuracy: 0.5,
      xp: XP_PER_CORRECT + XP_PER_WRONG + XP_SESSION_BONUS,
      finished: true,
    });
  });

  it('scores a partial session without the bonus', () => {
    const session = answerCurrent(startQuizSession([question(0), question(1)], NOW), {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW,
    });
    expect(scoreSession(session)).toEqual({
      answered: 1,
      correct: 1,
      total: 2,
      accuracy: 1,
      xp: XP_PER_CORRECT,
      finished: false,
    });
  });

  it('returns a zeroed summary for an empty session', () => {
    const session = startQuizSession([], NOW);
    expect(isSessionComplete(session)).toBe(true);
    expect(scoreSession(session)).toEqual({
      answered: 0,
      correct: 0,
      total: 0,
      accuracy: 0,
      xp: 0,
      finished: true,
    });
  });

  it('ends a session early without inventing answers or a bonus', () => {
    const session = answerCurrent(startQuizSession([question(0), question(1), question(2)], NOW), {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW,
    });
    const abandoned = abandonSession(session);
    expect(currentQuestion(abandoned)).toBeNull();
    expect(isSessionComplete(abandoned)).toBe(false);
    expect(scoreSession(abandoned)).toMatchObject({
      answered: 1,
      total: 3,
      xp: XP_PER_CORRECT,
      finished: false,
    });
  });

  it('measures duration between the first and last answer', () => {
    let session = startQuizSession([], NOW);
    expect(sessionDurationMs(session)).toBe(0);

    session = startQuizSession([question(0), question(1)], NOW);
    session = answerCurrent(session, {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: 500,
      nowMs: NOW + 1_000,
    });
    expect(sessionDurationMs(session)).toBe(0);
    session = answerCurrent(session, {
      questionId: 'q1',
      selectedOptionId: question(1).correctOptionId,
      responseMs: 500,
      nowMs: NOW + 5_000,
    });
    expect(sessionDurationMs(session)).toBe(4_000);
  });

  it('clamps invalid response times to zero', () => {
    const session = answerCurrent(startQuizSession([question(0)], NOW), {
      questionId: 'q0',
      selectedOptionId: question(0).correctOptionId,
      responseMs: Number.NaN,
      nowMs: NOW,
    });
    expect(session.answers[0]?.responseMs).toBe(0);
    expect(session.answers[0]?.quality).toBe(5);
  });
});
