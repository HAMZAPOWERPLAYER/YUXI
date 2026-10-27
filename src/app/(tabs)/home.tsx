import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Mascot } from '@/components/Mascot';
import { MascotBubble } from '@/components/MascotBubble';
import { ProgressRing } from '@/components/ProgressRing';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Stack } from '@/components/Stack';
import { ErrorState, LoadingState } from '@/components/StateViews';
import { getDailyGoalProgress } from '@/features/progress';
import type { TranslationKey } from '@/i18n/types';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useSettings } from '@/providers/useSettings';
import { now } from '@/services/clock';
import { useAppTheme } from '@/theme/ThemeProvider';
import { minutesFromSeconds } from '@/utils/date';

const TIPS: readonly TranslationKey[] = ['home.tip1', 'home.tip2', 'home.tip3', 'home.tip4'];

function greetingKey(hour: number): TranslationKey {
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

type QuickActionProps = {
  label: string;
  /** Kana glyph shown when no icon is given. */
  glyph?: string;
  icon?: IconName;
  onPress: () => void;
  accent?: boolean;
};

function QuickAction({ label, glyph, icon, onPress, accent = false }: QuickActionProps) {
  const theme = useAppTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed ? { opacity: 0.75 } : null]}
    >
      <Card tone={accent ? 'primarySoft' : 'surface'} style={styles.quickCard}>
        <Stack align="center" gap={theme.spacing.xxs}>
          {icon ? (
            <View
              style={[
                styles.quickGlyphWrap,
                { backgroundColor: theme.colors.surface2, borderRadius: theme.radii.pill },
              ]}
            >
              <Icon color="primaryText" name={icon} size={26} />
            </View>
          ) : (
            <View
              style={[
                styles.quickGlyphWrap,
                { backgroundColor: theme.colors.surface2, borderRadius: theme.radii.pill },
              ]}
            >
              <AppText variant="kanaLarge">{glyph}</AppText>
            </View>
          )}
          <AppText align="center" numberOfLines={1} variant="label">
            {label}
          </AppText>
        </Stack>
      </Card>
    </Pressable>
  );
}

export default function HomeScreen() {
  const t = useT();
  const theme = useAppTheme();
  const { settings } = useSettings();
  const progress = useProgress();

  if (progress.status === 'loading') {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  if (progress.status === 'error') {
    return (
      <Screen>
        <ErrorState body={t('errors.loadBody')} onAction={() => void progress.refresh()} />
      </Screen>
    );
  }

  const goal = getDailyGoalProgress(progress.todayStats.secondsActive, settings.dailyGoalMinutes);
  const minutes = minutesFromSeconds(goal.secondsActive);
  const tip = TIPS[Math.floor(now() / 86_400_000) % TIPS.length] ?? 'home.tip1';
  const hour = new Date(now()).getHours();
  const hasDue = progress.dueCount > 0;
  const sessionLength = Math.min(20, Math.max(5, progress.dueCount));

  const startReview = () => {
    router.push({
      pathname: '/practice/session',
      params: {
        mode: 'mixed',
        script: 'both',
        length: String(sessionLength),
      },
    });
  };

  return (
    <Screen
      header={
        <Row
          align="center"
          justify="between"
          style={{ paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm }}
        >
          <Row align="center" gap={theme.spacing.xs}>
            <Mascot decorative expression="happy" size={40} />
            <AppText color="primaryText" variant="brand">
              {t('common.appName')}
            </AppText>
          </Row>
          <IconButton
            accessibilityLabel={t('a11y.settings')}
            icon="settings-outline"
            onPress={() => router.navigate('/(tabs)/settings')}
          />
        </Row>
      }
    >
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="display">{t(greetingKey(hour))}</AppText>
          <AppText color="textMuted" variant="body">
            {t('home.subtitle')}
          </AppText>
        </Stack>

        <Card>
          <Row align="center" gap={theme.spacing.md}>
            <ProgressRing
              accessibilityLabel={t('home.goalProgress', {
                minutes,
                goal: settings.dailyGoalMinutes,
              })}
              progress={goal.ratio}
              size={124}
              strokeWidth={11}
            >
              <Stack align="center" gap={0}>
                <AppText color={goal.met ? 'success' : 'text'} variant="title">
                  {minutes}
                </AppText>
                <AppText color="textMuted" variant="caption">
                  {t('common.ofTotal', { current: minutes, total: settings.dailyGoalMinutes })}
                </AppText>
              </Stack>
            </ProgressRing>
            <Stack gap={theme.spacing.sm} style={styles.flex}>
              <AppText variant="heading">{t('home.goalTitle')}</AppText>
              <Badge label={t('home.level', { level: progress.level.level })} variant="primary" />
              <Row align="center" gap={6}>
                <Icon color="warning" name="flame" size={20} />
                <AppText variant="bodyStrong">
                  {t('home.streakDays', { count: progress.streak.current })}
                </AppText>
              </Row>
              <AppText color="textMuted" variant="caption">
                {goal.met
                  ? t('home.goalMet')
                  : t('home.goalProgress', {
                      minutes,
                      goal: settings.dailyGoalMinutes,
                    })}
              </AppText>
            </Stack>
          </Row>
        </Card>

        <Card onPress={hasDue ? startReview : undefined} tone={hasDue ? 'primarySoft' : 'surface'}>
          <Row align="center" gap={theme.spacing.sm}>
            <View
              style={[
                styles.actionIcon,
                {
                  backgroundColor: hasDue ? theme.colors.primary : theme.colors.surface2,
                  borderRadius: theme.radii.pill,
                },
              ]}
            >
              <Icon
                color={hasDue ? 'textOnPrimary' : 'primaryText'}
                name={hasDue ? 'refresh' : progress.studiedCount === 0 ? 'sparkles' : 'play'}
                size={26}
              />
            </View>
            <Stack gap={2} style={styles.flex}>
              <AppText variant="heading">
                {hasDue
                  ? t('home.dueTitle', { count: progress.dueCount })
                  : progress.studiedCount === 0
                    ? t('home.firstTitle')
                    : t('home.continueTitle')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {hasDue
                  ? t('home.dueBody')
                  : progress.studiedCount === 0
                    ? t('home.firstBody')
                    : t('home.continueBody')}
              </AppText>
            </Stack>
          </Row>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Button
              label={
                hasDue
                  ? t('home.reviewCta')
                  : progress.studiedCount === 0
                    ? t('home.firstCta')
                    : t('home.continueCta')
              }
              onPress={
                hasDue
                  ? startReview
                  : progress.studiedCount === 0
                    ? () => router.push('/learn/hiragana')
                    : () => router.navigate('/(tabs)/practice')
              }
              variant={hasDue ? 'primary' : 'secondary'}
            />
          </View>
        </Card>

        <Stack gap={theme.spacing.xs}>
          <AppText variant="heading">{t('practice.title')}</AppText>
          <Row gap={theme.spacing.sm}>
            <QuickAction
              glyph="あ"
              label={t('home.quickHiragana')}
              onPress={() => router.push('/learn/hiragana')}
            />
            <QuickAction
              glyph="ア"
              label={t('home.quickKatakana')}
              onPress={() => router.push('/learn/katakana')}
            />
            <QuickAction
              accent
              icon="school"
              label={t('home.quickPractice')}
              onPress={() => router.navigate('/(tabs)/practice')}
            />
          </Row>
        </Stack>

        <MascotBubble compact expression="happy" message={t(tip)} />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  quickAction: {
    flex: 1,
  },
  quickCard: {
    alignItems: 'center',
  },
  quickGlyphWrap: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  actionIcon: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
});
