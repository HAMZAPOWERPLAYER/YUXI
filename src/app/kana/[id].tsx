import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Stack } from '@/components/Stack';
import { ErrorState } from '@/components/StateViews';
import { StatTile } from '@/components/StatTile';
import { getConfusables, getById } from '@/features/kana/selectors';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { now, todayKey } from '@/services/clock';
import { resetVoiceCache, speakJapanese, stopSpeaking } from '@/services/tts';
import { useAppTheme } from '@/theme/ThemeProvider';
import { daysBetweenKeys, toLocalDayKey } from '@/utils/date';

export default function KanaDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const t = useT();
  const theme = useAppTheme();
  const { progressById } = useProgress();
  const [missingVoice, setMissingVoice] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const kana = params.id ? getById(params.id) : undefined;
  const progress = kana ? progressById.get(kana.id) : undefined;

  useEffect(
    () => () => {
      void stopSpeaking();
    },
    [],
  );

  if (!kana) {
    return (
      <Screen>
        <ScreenHeader back title={t('common.notFound')} />
        <ErrorState
          actionLabel={t('common.back')}
          body={t('errors.notFoundBody')}
          onAction={() => router.replace('/(tabs)/learn')}
          title={t('errors.notFoundTitle')}
        />
      </Screen>
    );
  }

  const attempts = (progress?.correct ?? 0) + (progress?.wrong ?? 0);
  const accuracy = attempts === 0 ? 0 : (progress?.correct ?? 0) / attempts;
  const accuracyPercent = Math.round(accuracy * 100);
  const confusables = getConfusables(kana);

  const listen = async (slow: boolean) => {
    setSpeaking(true);
    const outcome = await speakJapanese(kana.ttsText, { slow });
    setSpeaking(false);
    setMissingVoice(outcome === 'missing-voice');
  };

  const checkVoiceAgain = async () => {
    resetVoiceCache();
    setMissingVoice(false);
    await listen(false);
  };

  const dueLabel = (() => {
    if (!progress || progress.seen <= 0) return t('kanaDetail.notSeen');
    if (progress.dueAt <= now()) return t('kanaDetail.dueNow');
    const days = daysBetweenKeys(todayKey(), toLocalDayKey(progress.dueAt));
    if (days <= 0) return t('kanaDetail.dueNow');
    if (days === 1) return t('kanaDetail.dueTomorrow');
    return t('kanaDetail.dueIn', { count: days });
  })();

  return (
    <Screen
      header={
        <ScreenHeader
          back
          right={
            <IconButton
              accessibilityLabel={t('kanaDetail.listen')}
              icon="volume-high-outline"
              onPress={() => void listen(false)}
            />
          }
          title={t('kanaDetail.title')}
        />
      }
    >
      <Stack gap={theme.spacing.md}>
        <Card>
          <Stack align="center" gap={theme.spacing.xs}>
            <AppText align="center" variant="kanaHero">
              {kana.kana}
            </AppText>
            <AppText color="primaryText" variant="title">
              {kana.romaji}
            </AppText>
            <AppText align="center" color="textMuted" variant="body">
              {kana.urduHint}
            </AppText>
          </Stack>
        </Card>

        <Row gap={theme.spacing.sm}>
          <Button
            icon="volume-high-outline"
            label={t('kanaDetail.listen')}
            loading={speaking}
            onPress={() => void listen(false)}
            style={styles.flex}
          />
          <Button
            icon="speedometer-outline"
            label={t('kanaDetail.listenSlow')}
            onPress={() => void listen(true)}
            style={styles.flex}
            variant="secondary"
          />
        </Row>

        {missingVoice ? (
          <Card tone="warningSoft">
            <Stack gap={theme.spacing.xs}>
              <Row align="center" gap={theme.spacing.xs}>
                <Icon color="warning" name="volume-mute-outline" size={20} />
                <AppText variant="bodyStrong">{t('kanaDetail.ttsUnavailable')}</AppText>
              </Row>
              <AppText color="textMuted" variant="caption">
                {t('practice.unavailableBody')}
              </AppText>
              <Button
                fullWidth={false}
                label={t('common.checkAgain')}
                onPress={() => void checkVoiceAgain()}
                size="sm"
                variant="secondary"
              />
            </Stack>
          </Card>
        ) : null}

        <Stack gap={theme.spacing.xs}>
          <AppText variant="heading">{t('kanaDetail.stats')}</AppText>
          <Row gap={theme.spacing.xs}>
            <StatTile label={t('kanaDetail.seen')} value={String(progress?.seen ?? 0)} />
            <StatTile
              color="success"
              label={t('kanaDetail.correct')}
              value={String(progress?.correct ?? 0)}
            />
            <StatTile
              color="danger"
              label={t('kanaDetail.wrong')}
              value={String(progress?.wrong ?? 0)}
            />
          </Row>
          <Row gap={theme.spacing.xs}>
            <StatTile
              label={t('kanaDetail.accuracy')}
              value={
                attempts === 0 ? t('stats.none') : t('common.percent', { percent: accuracyPercent })
              }
            />
            <StatTile label={t('kanaDetail.nextReview')} value={dueLabel} />
          </Row>
        </Stack>

        {confusables.length > 0 ? (
          <Stack gap={theme.spacing.xs}>
            <AppText variant="heading">{t('kanaDetail.confusables')}</AppText>
            <Row gap={theme.spacing.xs} wrap>
              {confusables.map((item) => (
                <Pressable
                  accessibilityLabel={t('a11y.kana', { kana: item.kana, romaji: item.romaji })}
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => router.push(`/kana/${item.id}`)}
                >
                  <Card padding={theme.spacing.xs} style={styles.confusable} tone="surface2">
                    <Row align="center" gap={6}>
                      <AppText variant="kanaLarge">{item.kana}</AppText>
                      <AppText color="textMuted" variant="caption">
                        {item.romaji}
                      </AppText>
                    </Row>
                  </Card>
                </Pressable>
              ))}
            </Row>
          </Stack>
        ) : null}

        <Card tone="surface2">
          <Row align="center" gap={theme.spacing.sm}>
            <Icon color="textMuted" name="brush-outline" size={26} />
            <Stack gap={2} style={styles.flex}>
              <AppText variant="bodyStrong">{t('kanaDetail.strokeOrder')}</AppText>
              <AppText color="textMuted" variant="caption">
                {t('kanaDetail.strokeOrderSoon')}
              </AppText>
            </Stack>
          </Row>
        </Card>

        <Button
          icon="school"
          label={t('kanaDetail.practiceThis')}
          onPress={() =>
            router.push({
              pathname: '/practice/session',
              params: {
                kanaId: kana.id,
                length: '1',
                mode: 'kana-to-romaji',
                script: kana.script,
              },
            })
          }
        />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  confusable: {
    minWidth: 74,
  },
});
