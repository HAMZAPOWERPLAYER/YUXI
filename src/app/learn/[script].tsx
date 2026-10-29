import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { MasteryMark } from '@/components/MasteryMark';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { Stack } from '@/components/Stack';
import { ErrorState } from '@/components/StateViews';
import { buildRowMastery, masteryFor } from '@/features/kana/mastery';
import { getByGroup } from '@/features/kana/selectors';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { MasteryLevel } from '@/theme/tokens';
import type { Kana, KanaGroup, KanaScript } from '@/types/kana';

const GROUPS: readonly KanaGroup[] = ['basic', 'dakuten', 'yoon'];

const LEVEL_KEYS: Record<
  MasteryLevel,
  'chart.unseen' | 'chart.learning' | 'chart.familiar' | 'chart.mastered'
> = {
  unseen: 'chart.unseen',
  learning: 'chart.learning',
  familiar: 'chart.familiar',
  mastered: 'chart.mastered',
};

const LEVEL_COLORS: Record<
  MasteryLevel,
  'masteryUnseen' | 'masteryLearning' | 'masteryFamiliar' | 'masteryMastered'
> = {
  unseen: 'masteryUnseen',
  learning: 'masteryLearning',
  familiar: 'masteryFamiliar',
  mastered: 'masteryMastered',
};

function groupKey(group: KanaGroup): 'chart.basic' | 'chart.dakuten' | 'chart.yoon' {
  if (group === 'basic') return 'chart.basic';
  if (group === 'dakuten') return 'chart.dakuten';
  return 'chart.yoon';
}

type CellProps = {
  kana: Kana;
  level: MasteryLevel;
  showRomaji: boolean;
  onPress: () => void;
};

function KanaCell({ kana, level, showRomaji, onPress }: CellProps) {
  const t = useT();
  const theme = useAppTheme();
  const levelLabel = t(LEVEL_KEYS[level]);

  return (
    <Pressable
      accessibilityLabel={`${t('a11y.kana', { kana: kana.kana, romaji: kana.romaji })}, ${levelLabel}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors[LEVEL_COLORS[level]],
          borderRadius: theme.radii.sm,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <AppText variant="kana">{kana.kana}</AppText>
      {showRomaji ? (
        <AppText color="textMuted" lang="en" variant="caption">
          {kana.romaji}
        </AppText>
      ) : null}
      <MasteryMark color={LEVEL_COLORS[level]} level={level} size={7} />
    </Pressable>
  );
}

export default function ChartScreen() {
  const params = useLocalSearchParams<{ script?: string }>();
  const t = useT();
  const theme = useAppTheme();
  const { progress } = useProgress();
  const [group, setGroup] = useState<KanaGroup>('basic');
  const [showRomaji, setShowRomaji] = useState(true);

  const script: KanaScript | null =
    params.script === 'hiragana' || params.script === 'katakana' ? params.script : null;

  const pool = useMemo(() => (script ? getByGroup(script, group) : []), [script, group]);
  const rows = useMemo(
    () => (script ? buildRowMastery(pool, progress) : []),
    [script, pool, progress],
  );

  if (!script) {
    return (
      <Screen>
        <ScreenHeader back title={t('common.notFound')} />
        <ErrorState
          body={t('errors.notFoundBody')}
          onAction={() => router.replace('/(tabs)/learn')}
        />
      </Screen>
    );
  }

  const title = script === 'hiragana' ? t('chart.titleHiragana') : t('chart.titleKatakana');

  return (
    <Screen header={<ScreenHeader back subtitle={t('learn.hint')} title={title} />}>
      <Stack gap={theme.spacing.md}>
        <Segmented
          label={t('learn.title')}
          onChange={setGroup}
          options={GROUPS.map((item) => ({ label: t(groupKey(item)), value: item }))}
          value={group}
        />

        <Row align="center" justify="between">
          <AppText color="textMuted" variant="caption">
            {t('chart.practiceCount', { count: pool.length })}
          </AppText>
          <Button
            fullWidth={false}
            icon={showRomaji ? 'eye-off-outline' : 'eye-outline'}
            label={showRomaji ? t('chart.hideRomaji') : t('chart.showRomaji')}
            onPress={() => setShowRomaji((current) => !current)}
            size="sm"
            variant="ghost"
          />
        </Row>

        <Card padding={theme.spacing.sm}>
          <Stack gap={theme.spacing.xs}>
            {rows.map((row) => {
              const label =
                row.row === 'vowels' ? 'A' : row.row === 'n-final' ? 'N' : row.row.toUpperCase();
              return (
                <Row align="center" gap={theme.spacing.xs} key={row.row}>
                  <View style={styles.rowLabel}>
                    <AppText color="textMuted" variant="caption">
                      {label}
                    </AppText>
                  </View>
                  <Row dir="ltr" gap={4} wrap>
                    {row.kana.map((kana) => {
                      const level = masteryFor(progress.find((item) => item.kanaId === kana.id));
                      return (
                        <KanaCell
                          key={kana.id}
                          kana={kana}
                          level={level}
                          onPress={() => router.push(`/kana/${kana.id}`)}
                          showRomaji={showRomaji}
                        />
                      );
                    })}
                  </Row>
                </Row>
              );
            })}
            {rows.length === 0 ? (
              <AppText align="center" color="textMuted" variant="body">
                {t('chart.empty')}
              </AppText>
            ) : null}
          </Stack>
        </Card>

        <Row gap={theme.spacing.sm} justify="center" wrap>
          {(Object.keys(LEVEL_KEYS) as MasteryLevel[]).map((level) => (
            <Row align="center" gap={4} key={level}>
              <View
                style={[
                  styles.legendSwatch,
                  { backgroundColor: theme.colors[LEVEL_COLORS[level]] },
                ]}
              >
                <MasteryMark level={level} size={7} />
              </View>
              <AppText color="textMuted" variant="caption">
                {t(LEVEL_KEYS[level])}
              </AppText>
            </Row>
          ))}
        </Row>

        <Button
          icon="school"
          label={t('chart.practice', { count: pool.length })}
          onPress={() =>
            router.push({
              pathname: '/practice/session',
              params: { group, length: '10', mode: 'mixed', script },
            })
          }
        />
        <Button
          icon="options-outline"
          label={t('practice.title')}
          onPress={() =>
            router.navigate({
              pathname: '/(tabs)/practice',
              params: { group, script },
            })
          }
          variant="secondary"
        />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cell: {
    alignItems: 'center',
    borderBottomWidth: 3,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 44,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  rowLabel: {
    alignItems: 'center',
    width: 18,
  },
  legendSwatch: {
    alignItems: 'center',
    borderRadius: 3,
    height: 12,
    justifyContent: 'center',
    width: 12,
  },
});
