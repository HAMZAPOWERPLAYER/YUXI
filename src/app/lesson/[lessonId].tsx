import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, Platform } from 'react-native';

import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { getDatabase } from '@/db/client';
import type { Lesson, UnitFile } from '@/features/content';
import type { ExerciseAttempt } from '@/features/exercises';
import {
  answerCurrentExercise,
  buildCourseOverview,
  currentExercise,
  findLessonById,
  finishLessonRun,
  isLessonRunComplete,
  lessonStats,
  loadCourseContent,
  recordLessonExerciseAnswer,
  startLessonRun,
} from '@/features/lessons';
import type { LessonRun } from '@/features/lessons';
import { localizedTitle } from '@/features/lessons/labels';
import { LessonCompleteView } from '@/features/lessons/components/LessonCompleteView';
import {
  LessonExerciseView,
  type ExerciseFeedback,
} from '@/features/lessons/components/LessonExerciseView';
import type { DailyGoalMinutes } from '@/features/settings/settingsModel';
import { logStudyError } from '@/features/study';
import { useI18n, useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useSettings } from '@/providers/useSettings';
import { now } from '@/services/clock';
import { answerHaptic } from '@/services/haptics';
import type { LessonProgress } from '@/types/srs';

type Db = Awaited<ReturnType<typeof getDatabase>>;

const MAX_ACTIVE_SECONDS = 120;

function seedFromNow(): number {
  return Math.floor(now() % 2_147_483_647);
}

type LessonPlayerProps = {
  match: { file: UnitFile; lesson: Lesson };
  previous: LessonProgress | null;
  lessonTitle: string;
  unitTitle: string;
  dailyGoalMinutes: DailyGoalMinutes;
  hapticsEnabled: boolean;
  onBackToUnit: () => void;
  refresh: () => Promise<void>;
};

/**
 * Owns one lesson run. Mounting this component starts a run immediately, so
 * there is no state-setting effect; the parent remounts it per lesson id.
 */
function LessonPlayer({
  match,
  previous,
  lessonTitle,
  unitTitle,
  dailyGoalMinutes,
  hapticsEnabled,
  onBackToUnit,
  refresh,
}: LessonPlayerProps) {
  const t = useT();
  const [run, setRun] = useState<LessonRun>(() =>
    startLessonRun({
      unit: match.file,
      lesson: match.lesson,
      seed: seedFromNow(),
      nowMs: now(),
    }),
  );
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [answerXp, setAnswerXp] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const dbRef = useRef<Db | null>(null);
  const shownAtRef = useRef(now());
  const lastTickRef = useRef(now());
  const answerInFlightRef = useRef(false);
  const finishInFlightRef = useRef(false);

  const getDb = async (): Promise<Db> => {
    let db = dbRef.current;
    if (!db) {
      db = await getDatabase();
      dbRef.current = db;
    }
    return db;
  };

  const handleCheck = (attempt: ExerciseAttempt) => {
    // A ref guard closes the window before React applies the state updates,
    // so a double tap cannot record the same exercise twice.
    if (feedback || saving || answerInFlightRef.current) return;
    const exercise = currentExercise(run);
    if (!exercise) return;
    answerInFlightRef.current = true;

    const at = now();
    const responseMs = Math.max(0, at - shownAtRef.current);
    const seconds = Math.min(
      MAX_ACTIVE_SECONDS,
      Math.max(0, Math.floor((at - lastTickRef.current) / 1000)),
    );
    lastTickRef.current = at;

    const answered = answerCurrentExercise(run, attempt, at);
    setRun(answered.run);
    setFeedback({ attempt, correct: answered.correct });
    setSaving(true);
    setSaveError(false);
    void answerHaptic(answered.correct, hapticsEnabled);

    void (async () => {
      try {
        const db = await getDb();
        const saved = await recordLessonExerciseAnswer(db, {
          exercise,
          correct: answered.correct,
          responseMs,
          at,
          activeSeconds: seconds,
          dailyGoalMinutes,
        });
        setAnswerXp((current) => current + saved.xpEarned);

        if (isLessonRunComplete(answered.run)) {
          const completion = await finishLessonRun(db, {
            run: answered.run,
            previous,
            at: now(),
            dailyGoalMinutes,
          });
          setBonusXp(completion.bonusXp);
          setFinished(true);
          void refresh();
        }
      } catch (error) {
        logStudyError('lesson answer', error);
        setSaveError(true);
      } finally {
        answerInFlightRef.current = false;
        setSaving(false);
      }
    })();
  };

  const startFreshRun = () => {
    const at = now();
    setRun(
      startLessonRun({
        unit: match.file,
        lesson: match.lesson,
        seed: seedFromNow(),
        nowMs: at,
      }),
    );
    setFeedback(null);
    setSaving(false);
    setSaveError(false);
    setAnswerXp(0);
    setBonusXp(0);
    setFinished(false);
    setShowComplete(false);
    answerInFlightRef.current = false;
    finishInFlightRef.current = false;
    shownAtRef.current = at;
    lastTickRef.current = at;
  };

  const persistFinish = async (): Promise<boolean> => {
    if (finishInFlightRef.current) return false;
    finishInFlightRef.current = true;
    setSaving(true);
    setSaveError(false);
    try {
      const db = await getDb();
      const result = await finishLessonRun(db, {
        run,
        previous,
        at: now(),
        dailyGoalMinutes,
      });
      setBonusXp(result.bonusXp);
      setFinished(true);
      void refresh();
      return true;
    } catch (error) {
      logStudyError('lesson finish', error);
      setSaveError(true);
      return false;
    } finally {
      finishInFlightRef.current = false;
      setSaving(false);
    }
  };

  const handleNext = () => {
    if (!feedback || saving || finishInFlightRef.current) return;
    if (isLessonRunComplete(run)) {
      if (finished) {
        setShowComplete(true);
        void refresh();
        return;
      }
      // The lesson is answered but the completion write has not succeeded
      // yet (or is still retrying), so stay on the last exercise and retry.
      void (async () => {
        if (await persistFinish()) setShowComplete(true);
      })();
      return;
    }
    const at = now();
    setFeedback(null);
    shownAtRef.current = at;
    lastTickRef.current = at;
  };

  const leave = async () => {
    if (run.attempts.length > 0 && (!isLessonRunComplete(run) || !finished)) {
      try {
        const db = await getDb();
        await finishLessonRun(db, {
          run,
          previous,
          at: now(),
          dailyGoalMinutes,
        });
      } catch (error) {
        logStudyError('lesson quit', error);
      }
    }

    await refresh().catch(() => undefined);
    onBackToUnit();
  };

  const quit = () => {
    Alert.alert(t('lesson.quitTitle'), t('lesson.quitBody'), [
      { style: 'cancel', text: t('common.cancel') },
      {
        onPress: () => void leave(),
        style: 'destructive',
        text: t('lesson.quitConfirm'),
      },
    ]);
  };

  const quitRef = useRef(quit);
  useEffect(() => {
    quitRef.current = quit;
  });

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    // Android hardware back must run the same quit flow, otherwise a
    // partially completed run is popped without persisting progress.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showComplete || finished) {
        onBackToUnit();
        return true;
      }
      quitRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [finished, onBackToUnit, showComplete]);

  const header = <ScreenHeader back onBack={quit} subtitle={unitTitle} title={lessonTitle} />;

  if (run.exercises.length === 0) {
    return (
      <Screen header={header}>
        <EmptyState
          actionLabel={t('lesson.backToUnit')}
          body={t('lesson.emptyBody')}
          onAction={onBackToUnit}
          title={t('lesson.emptyTitle')}
        />
      </Screen>
    );
  }

  if (showComplete) {
    return (
      <Screen header={header}>
        <LessonCompleteView
          lessonTitle={lessonTitle}
          onBackToUnit={onBackToUnit}
          onRepeat={startFreshRun}
          saveError={saveError}
          stats={lessonStats(run)}
          xp={answerXp + bonusXp}
        />
      </Screen>
    );
  }

  const exercise = currentExercise(run);
  if (!exercise) {
    return (
      <Screen header={header}>
        <LoadingState />
      </Screen>
    );
  }

  const total = run.exercises.length;
  const currentNumber = Math.min(total, feedback ? run.index : run.index + 1);

  return (
    <Screen header={header}>
      <LessonExerciseView
        currentNumber={currentNumber}
        exercise={exercise}
        feedback={feedback}
        isLast={isLessonRunComplete(run)}
        key={exercise.id}
        onCheck={handleCheck}
        onNext={handleNext}
        onQuit={quit}
        saveError={saveError}
        saving={saving}
        total={total}
      />
    </Screen>
  );
}

export default function LessonScreen() {
  const params = useLocalSearchParams<{ lessonId?: string }>();
  const t = useT();
  const { language } = useI18n();
  const { settings } = useSettings();
  const { status: progressStatus, lessonProgress, lessonProgressById, refresh } = useProgress();
  const content = useMemo(() => loadCourseContent(), []);
  const match = useMemo(
    () => (params.lessonId ? findLessonById(content.units, params.lessonId) : null),
    [content.units, params.lessonId],
  );
  const overviews = useMemo(
    () => buildCourseOverview(content.units, lessonProgress),
    [content.units, lessonProgress],
  );
  const unitOverview = match
    ? overviews.find((entry) => entry.file.unit.id === match.file.unit.id)
    : undefined;
  const lessonOverview = unitOverview?.lessons.find(
    (entry) => entry.lesson.id === match?.lesson.id,
  );
  const locked = lessonOverview?.status === 'locked';

  const backToUnit = () => {
    if (match) router.replace(`/course/${match.file.unit.id}`);
    else router.replace('/course');
  };

  if (content.error) {
    return (
      <Screen header={<ScreenHeader back title={t('course.loadErrorTitle')} />}>
        <EmptyState
          actionLabel={t('course.emptyCta')}
          body={t('course.loadErrorBody')}
          onAction={() => router.replace('/(tabs)/learn')}
          title={t('course.loadErrorTitle')}
        />
      </Screen>
    );
  }

  if (!match) {
    return (
      <Screen header={<ScreenHeader back title={t('lesson.notFoundTitle')} />}>
        <EmptyState
          actionLabel={t('course.title')}
          body={t('lesson.notFoundBody')}
          onAction={() => router.replace('/course')}
          title={t('lesson.notFoundTitle')}
        />
      </Screen>
    );
  }

  const lessonTitle = localizedTitle(match.lesson, language);
  const unitTitle = localizedTitle(match.file.unit, language);

  if (progressStatus === 'loading') {
    return (
      <Screen header={<ScreenHeader back subtitle={unitTitle} title={lessonTitle} />}>
        <LoadingState />
      </Screen>
    );
  }

  if (progressStatus === 'error') {
    return (
      <Screen header={<ScreenHeader back subtitle={unitTitle} title={lessonTitle} />}>
        <ErrorState onAction={() => void refresh()} />
      </Screen>
    );
  }

  if (locked) {
    return (
      <Screen
        header={<ScreenHeader back onBack={backToUnit} subtitle={unitTitle} title={lessonTitle} />}
      >
        <EmptyState
          actionLabel={t('lesson.backToUnit')}
          body={t('lesson.lockedBody')}
          onAction={backToUnit}
          title={t('lesson.lockedTitle')}
        />
      </Screen>
    );
  }

  return (
    <LessonPlayer
      dailyGoalMinutes={settings.dailyGoalMinutes}
      hapticsEnabled={settings.hapticsEnabled}
      key={match.lesson.id}
      lessonTitle={lessonTitle}
      match={match}
      onBackToUnit={backToUnit}
      previous={lessonProgressById.get(match.lesson.id) ?? null}
      refresh={refresh}
      unitTitle={unitTitle}
    />
  );
}
