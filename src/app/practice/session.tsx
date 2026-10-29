import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getDatabase } from '@/db/client';
import { answerCurrent, currentQuestion, startQuizSession } from '@/features/quiz/engine';
import {
  type PreparedQuiz,
  type QuizRequest,
  parseGroup,
  parseLength,
  parseMode,
  parseScript,
  prepareQuiz,
} from '@/features/quiz/sessionSetup';
import { completeSession, logStudyError, recordAnswer, recordStudySeconds } from '@/features/study';
import { QuizPlayView, type QuizFeedbackState } from '@/features/quiz/components/QuizPlayView';
import {
  QuizLoadErrorScreen,
  QuizLoadingScreen,
} from '@/features/quiz/components/QuizSessionStates';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useSettings } from '@/providers/useSettings';
import { now } from '@/services/clock';
import { answerHaptic } from '@/services/haptics';
import { type SpeakOutcome, speakJapanese, stopSpeaking } from '@/services/tts';
import type { QuizSession } from '@/types/quiz';

type Db = Awaited<ReturnType<typeof getDatabase>>;

const MAX_ACTIVE_SECONDS = 120;

export default function QuizSessionScreen() {
  const params = useLocalSearchParams<{
    mode?: string;
    script?: string;
    group?: string;
    length?: string;
    kanaId?: string;
  }>();
  const t = useT();
  const { settings } = useSettings();
  const { refresh } = useProgress();

  const request = useMemo<QuizRequest>(
    () => ({
      group: parseGroup(params.group),
      kanaId: params.kanaId,
      length: parseLength(params.length),
      mode: parseMode(params.mode),
      script: parseScript(params.script),
    }),
    [params.group, params.kanaId, params.length, params.mode, params.script],
  );

  const [attempt, setAttempt] = useState(0);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [prepared, setPrepared] = useState<PreparedQuiz | null>(null);
  const [feedback, setFeedback] = useState<QuizFeedbackState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [ttsOutcome, setTtsOutcome] = useState<SpeakOutcome | null>(null);

  const dbRef = useRef<Db | null>(null);
  const questionShownAtRef = useRef(now());
  const lastTickRef = useRef(now());
  const activeSecondsRef = useRef(0);
  const answerXpRef = useRef(0);
  const newKanaRef = useRef(0);
  const bonusXpRef = useRef(0);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const db = await getDatabase();
        const next = await prepareQuiz(db, request, now());
        if (!active) return;

        dbRef.current = db;
        setPrepared(next);
        setSession(startQuizSession(next.questions, now()));
        setFeedback(null);
        setSaveError(false);
        setTtsOutcome(null);
        activeSecondsRef.current = 0;
        answerXpRef.current = 0;
        newKanaRef.current = 0;
        bonusXpRef.current = 0;
        questionShownAtRef.current = now();
        lastTickRef.current = now();
      } catch (error) {
        logStudyError('prepare session', error);
        if (active) setLoadError(true);
      }
    })();

    return () => {
      active = false;
      void stopSpeaking();
    };
  }, [attempt, request]);

  const question = feedback?.question ?? (session ? currentQuestion(session) : null);
  const total = session?.questions.length ?? 0;
  const currentNumber = session ? Math.min(total, feedback ? session.index : session.index + 1) : 0;
  const isLast = session ? session.index >= session.questions.length : false;

  useEffect(() => {
    if (!question || feedback || question.mode !== 'listening' || !prepared?.voiceAvailable) {
      return;
    }
    void speakJapanese(question.kana.ttsText);
  }, [feedback, prepared?.voiceAvailable, question]);

  const replay = async () => {
    if (!question) return;
    setTtsOutcome(await speakJapanese(question.kana.ttsText));
  };

  const quit = () => {
    Alert.alert(t('quiz.quitTitle'), t('quiz.quitBody'), [
      { style: 'cancel', text: t('common.cancel') },
      {
        onPress: () => {
          const at = now();
          const seconds = Math.min(
            MAX_ACTIVE_SECONDS,
            Math.max(0, Math.floor((at - lastTickRef.current) / 1000)),
          );
          const db = dbRef.current;
          if (db && seconds > 0) {
            void recordStudySeconds(db, {
              at,
              dailyGoalMinutes: settings.dailyGoalMinutes,
              seconds,
            }).catch((error: unknown) => logStudyError('quit', error));
          }
          void stopSpeaking();
          void refresh();
          if (router.canGoBack()) router.back();
          else router.replace('/(tabs)/practice');
        },
        style: 'destructive',
        text: t('quiz.quitConfirm'),
      },
    ]);
  };

  const quitRef = useRef(quit);
  useEffect(() => {
    quitRef.current = quit;
  });

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    // Hardware back must use the same guarded exit as the header button so the
    // session is not popped without confirmation and study-time persistence.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      quitRef.current();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const selectOption = async (optionId: string) => {
    if (!session || !question || feedback || saving) return;
    const at = now();
    const responseMs = Math.max(0, at - questionShownAtRef.current);
    const seconds = Math.min(
      MAX_ACTIVE_SECONDS,
      Math.max(0, Math.floor((at - lastTickRef.current) / 1000)),
    );
    lastTickRef.current = at;
    activeSecondsRef.current += seconds;

    const correct = optionId === question.correctOptionId;
    const wasNew = !prepared?.seenBefore.has(question.kana.id);
    if (wasNew) newKanaRef.current += 1;

    setSession(
      answerCurrent(session, {
        nowMs: at,
        questionId: question.id,
        responseMs,
        selectedOptionId: optionId,
      }),
    );
    setFeedback({ correct, question, selectedOptionId: optionId });
    setSaveError(false);
    setSaving(true);
    void answerHaptic(correct, settings.hapticsEnabled);

    let db = dbRef.current;
    try {
      if (!db) {
        db = await getDatabase();
        dbRef.current = db;
      }
      const result = await recordAnswer(db, {
        at,
        correct,
        dailyGoalMinutes: settings.dailyGoalMinutes,
        activeSeconds: seconds,
        kanaId: question.kana.id,
        mode: question.mode,
        responseMs,
      });
      answerXpRef.current += result.xpEarned;
    } catch (error) {
      // Do not add unpersisted XP: the summary must match what was written.
      logStudyError('answer', error);
      setSaveError(true);
    }

    const lastQuestion = session.index + 1 >= session.questions.length;
    if (lastQuestion) {
      try {
        if (!db) {
          db = await getDatabase();
          dbRef.current = db;
        }
        const completion = await completeSession(db, {
          at,
          dailyGoalMinutes: settings.dailyGoalMinutes,
          questionCount: session.questions.length,
        });
        bonusXpRef.current = completion.bonusXp;
      } catch (error) {
        logStudyError('complete session', error);
        setSaveError(true);
      }
      void refresh();
    }

    setSaving(false);
  };

  const finish = () => {
    if (!session) return;
    const correct = session.answers.filter((answer) => answer.correct).length;
    router.replace({
      pathname: '/practice/summary',
      params: {
        answered: String(session.answers.length),
        correct: String(correct),
        group: request.group ?? '',
        kanaId: request.kanaId ?? '',
        length: String(request.length),
        mode: request.mode,
        newKana: String(newKanaRef.current),
        script: request.script,
        seconds: String(activeSecondsRef.current),
        total: String(session.questions.length),
        xp: String(answerXpRef.current + bonusXpRef.current),
      },
    });
  };

  const next = () => {
    if (!session || !feedback) return;
    if (session.index >= session.questions.length) {
      finish();
      return;
    }
    setFeedback(null);
    setTtsOutcome(null);
    questionShownAtRef.current = now();
    lastTickRef.current = now();
  };

  if (loadError) {
    return (
      <QuizLoadErrorScreen
        onBack={() => router.replace('/(tabs)/practice')}
        onRetry={() => {
          setLoadError(false);
          setAttempt((current) => current + 1);
        }}
      />
    );
  }

  if (!session || !prepared || !question) {
    return <QuizLoadingScreen />;
  }

  return (
    <Screen header={<ScreenHeader back onBack={quit} title={t('quiz.title')} />}>
      <QuizPlayView
        currentNumber={currentNumber}
        feedback={feedback}
        isLast={isLast}
        onNext={next}
        onQuit={quit}
        onReplay={() => void replay()}
        onSelectOption={(optionId) => void selectOption(optionId)}
        question={question}
        saveError={saveError}
        saving={saving}
        total={total}
        ttsOutcome={ttsOutcome}
        voiceAvailable={prepared.voiceAvailable}
      />
    </Screen>
  );
}
