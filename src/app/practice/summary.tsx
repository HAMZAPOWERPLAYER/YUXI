import { router, useLocalSearchParams } from 'expo-router';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { ProgressRing } from '@/components/ProgressRing';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack } from '@/components/Stack';
import { StatTile } from '@/components/StatTile';
import { useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import { minutesFromSeconds } from '@/utils/date';

function numberParam(value: string | string[] | undefined, fallback = 0): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function stringParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function SummaryScreen() {
  const t = useT();
  const theme = useAppTheme();
  const params = useLocalSearchParams<{
    correct?: string;
    answered?: string;
    total?: string;
    xp?: string;
    seconds?: string;
    newKana?: string;
    mode?: string;
    script?: string;
    group?: string;
    length?: string;
    kanaId?: string;
  }>();

  const correct = numberParam(params.correct);
  const answered = numberParam(params.answered);
  const total = numberParam(params.total);
  const xp = numberParam(params.xp);
  const seconds = numberParam(params.seconds);
  const newKana = numberParam(params.newKana);
  const accuracy = answered === 0 ? 0 : correct / answered;
  const percent = Math.round(accuracy * 100);
  const minutes = minutesFromSeconds(seconds);
  const timeLabel =
    seconds < 60
      ? t('common.secondsShort', { count: seconds })
      : t('common.minutesShort', { count: minutes });

  const expression = accuracy >= 0.8 ? 'cheer' : accuracy >= 0.5 ? 'happy' : 'thinking';
  const message =
    accuracy >= 0.8 ? t('summary.great') : accuracy >= 0.5 ? t('summary.good') : t('summary.low');

  const goPractice = () => router.replace('/(tabs)/practice');

  const practiceAgain = () => {
    router.replace({
      pathname: '/practice/session',
      params: {
        group: stringParam(params.group),
        kanaId: stringParam(params.kanaId),
        length: stringParam(params.length) || '10',
        mode: stringParam(params.mode) || 'mixed',
        script: stringParam(params.script) || 'both',
      },
    });
  };

  return (
    <Screen
      header={
        <ScreenHeader
          back={false}
          right={
            <IconButton accessibilityLabel={t('common.close')} icon="close" onPress={goPractice} />
          }
          title={t('summary.title')}
        />
      }
    >
      <Stack gap={theme.spacing.lg}>
        <Card>
          <Stack align="center" gap={theme.spacing.sm}>
            <ProgressRing
              accessibilityLabel={t('summary.accuracy')}
              progress={accuracy}
              size={148}
              strokeWidth={13}
            >
              <Stack align="center" gap={0}>
                <AppText variant="title">{percent}%</AppText>
                <AppText color="textMuted" variant="caption">
                  {t('summary.accuracy')}
                </AppText>
              </Stack>
            </ProgressRing>
            <Mascot decorative expression={expression} size={92} />
            <AppText align="center" variant="heading">
              {message}
            </AppText>
            <AppText align="center" color="textMuted" variant="body">
              {t('summary.subtitle')}
            </AppText>
            <AppText align="center" color="textMuted" variant="caption">
              {t('summary.correctCount', { correct, total: answered })}
            </AppText>
          </Stack>
        </Card>

        <Row gap={theme.spacing.sm} wrap>
          <StatTile color="primaryText" icon="star" label={t('summary.xp')} value={`+${xp}`} />
          <StatTile color="text" icon="time-outline" label={t('summary.time')} value={timeLabel} />
          <StatTile
            color="success"
            icon="sparkles"
            label={t('summary.newKana')}
            value={String(newKana)}
          />
        </Row>

        <Stack gap={theme.spacing.xs}>
          <Button icon="refresh" label={t('summary.review')} onPress={practiceAgain} />
          <Button
            icon="checkmark"
            label={t('summary.done')}
            onPress={goPractice}
            variant="secondary"
          />
        </Stack>
        {total === 0 ? (
          <AppText align="center" color="textMuted" variant="caption">
            {t('stats.noData')}
          </AppText>
        ) : null}
      </Stack>
    </Screen>
  );
}
