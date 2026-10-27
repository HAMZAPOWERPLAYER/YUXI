import { type PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getDatabase } from '@/db/client';
import {
  getAllDailyStats,
  getAllKanaProgress,
  getAllMeta,
  getRecentReviewLog,
} from '@/db/repositories';
import { readCompletedSessionDays } from '@/features/study';
import {
  collectActiveDays,
  levelForXp,
  summarizeStreak,
  type LevelInfo,
  type StreakSummary,
} from '@/features/progress';
import { accuracyOverDays, emptyDailyStats } from '@/features/stats';
import { now, todayKey } from '@/services/clock';
import type { DailyStats, KanaProgress, ReviewLogEntry } from '@/types/kana';
import { logEvent } from '@/utils/logger';

import { ProgressContext, type ProgressContextValue, type ProgressStatus } from './ProgressContext';

const RECENT_LOG_LIMIT = 20;

type Snapshot = {
  progress: KanaProgress[];
  stats: DailyStats[];
  meta: Record<string, string | null>;
  recentLog: ReviewLogEntry[];
};

const EMPTY_SNAPSHOT: Snapshot = { progress: [], stats: [], meta: {}, recentLog: [] };

type Derived = {
  progressById: ReadonlyMap<string, KanaProgress>;
  today: string;
  todayStats: DailyStats;
  totalXp: number;
  level: LevelInfo;
  streak: StreakSummary;
  dueCount: number;
  studiedCount: number;
  accuracy7: number;
  accuracy30: number;
  recentKanaIds: string[];
};

function derive(snapshot: Snapshot, at: number): Derived {
  const today = todayKey(at);
  const progressById = new Map(snapshot.progress.map((row) => [row.kanaId, row]));
  const activeDays = collectActiveDays(snapshot.stats, readCompletedSessionDays(snapshot.meta));
  const totalXp = snapshot.stats.reduce((sum, row) => sum + Math.max(0, row.xp), 0);
  const todayStats = snapshot.stats.find((row) => row.day === today) ?? emptyDailyStats(today);

  let dueCount = 0;
  let studiedCount = 0;
  for (const row of snapshot.progress) {
    if (row.seen <= 0) continue;
    studiedCount += 1;
    if (row.dueAt <= at) dueCount += 1;
  }

  const recentKanaIds: string[] = [];
  const seen = new Set<string>();
  for (const entry of snapshot.recentLog) {
    if (seen.has(entry.kanaId)) continue;
    seen.add(entry.kanaId);
    recentKanaIds.push(entry.kanaId);
  }

  return {
    progressById,
    today,
    todayStats,
    totalXp,
    level: levelForXp(totalXp),
    streak: summarizeStreak(today, activeDays),
    dueCount,
    studiedCount,
    accuracy7: accuracyOverDays(snapshot.stats, today, 7),
    accuracy30: accuracyOverDays(snapshot.stats, today, 30),
    recentKanaIds,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function readSnapshot(): Promise<Snapshot> {
  const db = await getDatabase();
  const [progress, stats, meta, recentLog] = await Promise.all([
    getAllKanaProgress(db),
    getAllDailyStats(db),
    getAllMeta(db),
    getRecentReviewLog(db, RECENT_LOG_LIMIT),
  ]);
  return { progress, stats, meta, recentLog };
}

/**
 * Owns the read model for progress, stats and streaks. Screens call refresh()
 * after writing answers or importing data; writes are never performed here.
 */
export function ProgressProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [status, setStatus] = useState<ProgressStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const applySnapshot = useCallback((next: Snapshot) => {
    if (!mounted.current) return;
    setSnapshot(next);
    setStatus('ready');
    setError(null);
  }, []);

  const applyError = useCallback((caught: unknown) => {
    logEvent('error', 'Could not load progress', caught);
    if (!mounted.current) return;
    setError(messageOf(caught));
    setStatus((current) => (current === 'ready' ? 'ready' : 'error'));
  }, []);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      applySnapshot(await readSnapshot());
    } catch (caught) {
      applyError(caught);
    } finally {
      inFlight.current = false;
    }
  }, [applyError, applySnapshot]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const next = await readSnapshot();
        if (active) applySnapshot(next);
      } catch (caught) {
        if (active) applyError(caught);
      }
    })();
    return () => {
      active = false;
    };
  }, [applyError, applySnapshot]);

  const refresh = useCallback(() => load(), [load]);

  const value = useMemo<ProgressContextValue>(() => {
    const derived = derive(snapshot, now());
    return {
      status,
      error,
      progress: snapshot.progress,
      progressById: derived.progressById,
      stats: snapshot.stats,
      meta: snapshot.meta,
      recentLog: snapshot.recentLog,
      todayStats: derived.todayStats,
      today: derived.today,
      totalXp: derived.totalXp,
      level: derived.level,
      streak: derived.streak,
      dueCount: derived.dueCount,
      studiedCount: derived.studiedCount,
      accuracy7: derived.accuracy7,
      accuracy30: derived.accuracy30,
      recentKanaIds: derived.recentKanaIds,
      refresh,
    };
  }, [snapshot, status, error, refresh]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}
