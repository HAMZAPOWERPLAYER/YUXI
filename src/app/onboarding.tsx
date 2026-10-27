import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Mascot } from '@/components/Mascot';
import { Row } from '@/components/Row';
import { Screen } from '@/components/Screen';
import { Stack } from '@/components/Stack';
import type { DailyGoalMinutes } from '@/features/settings/settingsModel';
import { LANGUAGE_LABELS, useI18n, useT } from '@/i18n';
import type { Language } from '@/i18n/types';
import { useSettings } from '@/providers/useSettings';
import { tapHaptic } from '@/services/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

type Step = 0 | 1 | 2;
const GOALS: readonly DailyGoalMinutes[] = [5, 10, 20];
const TOTAL_STEPS = 3;

function goalKey(
  goal: DailyGoalMinutes,
): 'onboarding.goal5' | 'onboarding.goal10' | 'onboarding.goal20' {
  if (goal === 5) return 'onboarding.goal5';
  if (goal === 10) return 'onboarding.goal10';
  return 'onboarding.goal20';
}

function goalHintKey(
  goal: DailyGoalMinutes,
): 'onboarding.goal5Hint' | 'onboarding.goal10Hint' | 'onboarding.goal20Hint' {
  if (goal === 5) return 'onboarding.goal5Hint';
  if (goal === 10) return 'onboarding.goal10Hint';
  return 'onboarding.goal20Hint';
}

export default function OnboardingScreen() {
  const t = useT();
  const theme = useAppTheme();
  const { language, setLanguage } = useI18n();
  const { settings, updateSettings } = useSettings();
  const [step, setStep] = useState<Step>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [selectedGoal, setSelectedGoal] = useState<DailyGoalMinutes>(settings.dailyGoalMinutes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const chooseLanguage = (next: Language) => {
    void tapHaptic(settings.hapticsEnabled);
    setSelectedLanguage(next);
    setLanguage(next);
  };

  const chooseGoal = (next: DailyGoalMinutes) => {
    void tapHaptic(settings.hapticsEnabled);
    setSelectedGoal(next);
  };

  const next = () => {
    void tapHaptic(settings.hapticsEnabled);
    if (step < 2) {
      setStep((current) => (current + 1) as Step);
    }
  };

  const back = () => {
    if (step > 0) setStep((current) => (current - 1) as Step);
  };

  const finish = async () => {
    if (saving) return;
    setSaving(true);
    setError(false);
    try {
      await updateSettings({
        language: selectedLanguage,
        dailyGoalMinutes: selectedGoal,
        onboardingDone: true,
      });
      void tapHaptic(settings.hapticsEnabled);
      router.replace('/(tabs)/home');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack gap={theme.spacing.lg} style={styles.fill}>
        <Row align="center" justify="between">
          <AppText variant="brand" color="primaryText">
            {t('common.appName')}
          </AppText>
          <AppText color="textMuted" variant="caption">
            {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
          </AppText>
        </Row>

        <Row gap={6}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: index <= step ? theme.colors.primary : theme.colors.surface2,
                  flex: index === step ? 2 : 1,
                },
              ]}
            />
          ))}
        </Row>

        {step === 0 ? (
          <Stack align="center" gap={theme.spacing.md} style={styles.step}>
            <Mascot expression="happy" size={172} />
            <Stack align="center" gap={theme.spacing.xs}>
              <AppText align="center" variant="title">
                {t('onboarding.welcomeTitle')}
              </AppText>
              <AppText align="center" color="textMuted" variant="body">
                {t('onboarding.welcomeBody')}
              </AppText>
            </Stack>
          </Stack>
        ) : null}

        {step === 1 ? (
          <Stack gap={theme.spacing.md}>
            <Stack gap={theme.spacing.xs}>
              <AppText variant="title">{t('onboarding.languageTitle')}</AppText>
              <AppText color="textMuted" variant="body">
                {t('onboarding.languageBody')}
              </AppText>
            </Stack>
            {(['ur', 'en'] as const).map((option) => {
              const selected = selectedLanguage === option;
              return (
                <Pressable
                  accessibilityLabel={LANGUAGE_LABELS[option].native}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option}
                  onPress={() => chooseLanguage(option)}
                >
                  <Card tone={selected ? 'primarySoft' : 'surface'}>
                    <Row align="center" justify="between">
                      <Stack gap={2}>
                        <AppText lang={option} variant="heading">
                          {LANGUAGE_LABELS[option].native}
                        </AppText>
                        <AppText color="textMuted" lang="en" variant="caption">
                          {LANGUAGE_LABELS[option].english}
                        </AppText>
                      </Stack>
                      <View
                        style={[
                          styles.check,
                          {
                            backgroundColor: selected
                              ? theme.colors.primary
                              : theme.colors.surface2,
                            borderColor: selected ? theme.colors.primary : theme.colors.border,
                          },
                        ]}
                      >
                        {selected ? (
                          <Icon color="textOnPrimary" name="checkmark" size={16} />
                        ) : null}
                      </View>
                    </Row>
                  </Card>
                </Pressable>
              );
            })}
          </Stack>
        ) : null}

        {step === 2 ? (
          <Stack gap={theme.spacing.md}>
            <Stack gap={theme.spacing.xs}>
              <AppText variant="title">{t('onboarding.goalTitle')}</AppText>
              <AppText color="textMuted" variant="body">
                {t('onboarding.goalBody')}
              </AppText>
            </Stack>
            {GOALS.map((goal) => {
              const selected = selectedGoal === goal;
              return (
                <Pressable
                  accessibilityLabel={`${t(goalKey(goal))}, ${t(goalHintKey(goal))}`}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={goal}
                  onPress={() => chooseGoal(goal)}
                >
                  <Card tone={selected ? 'primarySoft' : 'surface'}>
                    <Row align="center" justify="between">
                      <Stack gap={2}>
                        <AppText variant="heading">{t(goalKey(goal))}</AppText>
                        <AppText color="textMuted" variant="caption">
                          {t(goalHintKey(goal))}
                        </AppText>
                      </Stack>
                      {selected ? (
                        <Icon color="primaryText" name="checkmark-circle" size={24} />
                      ) : null}
                    </Row>
                  </Card>
                </Pressable>
              );
            })}
            {error ? (
              <AppText color="danger" variant="caption">
                {t('settings.saveError')}
              </AppText>
            ) : null}
          </Stack>
        ) : null}

        <View style={styles.spacer} />

        <Stack gap={theme.spacing.xs}>
          {step === 2 ? (
            <Button
              icon="sparkles"
              label={t('onboarding.finish')}
              loading={saving}
              onPress={() => void finish()}
              size="lg"
            />
          ) : (
            <Button
              icon="arrow-forward"
              iconPosition="end"
              label={step === 0 ? t('onboarding.welcomeCta') : t('common.continue')}
              onPress={next}
              size="lg"
            />
          )}
          {step > 0 ? (
            <Button disabled={saving} label={t('common.back')} onPress={back} variant="ghost" />
          ) : null}
        </Stack>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: {
    flexGrow: 1,
  },
  step: {
    paddingTop: 8,
  },
  dots: {
    flexDirection: 'row',
  },
  dot: {
    borderRadius: 999,
    height: 6,
  },
  check: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  spacer: {
    flex: 1,
  },
});
