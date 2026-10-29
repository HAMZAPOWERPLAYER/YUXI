import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { IconButton } from '@/components/IconButton';
import { Row } from '@/components/Row';
import { Screen, TAB_SCREEN_EDGES } from '@/components/Screen';
import { Segmented } from '@/components/Segmented';
import { Stack } from '@/components/Stack';
import { getAllKana } from '@/features/kana/selectors';
import { ModeSelector } from '@/features/practice/ModeSelector';
import type { ModeChoice, ScriptChoice } from '@/features/quiz/sessionSetup';
import { useT } from '@/i18n';
import { useProgress } from '@/providers/useProgress';
import { useSettings } from '@/providers/useSettings';
import { now } from '@/services/clock';
import { tapHaptic } from '@/services/haptics';
import { hasJapaneseVoice, resetVoiceCache } from '@/services/tts';
import { useAppTheme } from '@/theme/ThemeProvider';
import type { KanaGroup } from '@/types/kana';

type VoiceStatus = 'checking' | 'available' | 'missing';

const LENGTHS = [5, 10, 20] as const;

function isScriptChoice(value: string | undefined): value is ScriptChoice {
  return value === 'hiragana' || value === 'katakana' || value === 'both';
}

function isKanaGroup(value: string | undefined): value is KanaGroup {
  return value === 'basic' || value === 'dakuten' || value === 'yoon';
}

export default function PracticeScreen() {
  const params = useLocalSearchParams<{ script?: string; group?: string }>();
  return (
    <PracticeSetup
      initialGroup={params.group}
      initialScript={params.script}
      key={`${params.script ?? ''}:${params.group ?? ''}`}
    />
  );
}

type PracticeSetupProps = {
  initialScript?: string;
  initialGroup?: string;
};

function PracticeSetup({ initialScript, initialGroup }: PracticeSetupProps) {
  const t = useT();
  const theme = useAppTheme();
  const { settings } = useSettings();
  const { progress } = useProgress();

  const [script, setScript] = useState<ScriptChoice>(() =>
    isScriptChoice(initialScript) ? initialScript : 'both',
  );
  const [group, setGroup] = useState<KanaGroup | null>(() =>
    isKanaGroup(initialGroup) ? initialGroup : null,
  );
  const [mode, setMode] = useState<ModeChoice>('mixed');
  const [length, setLength] = useState<number>(10);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('checking');

  useEffect(() => {
    let active = true;
    void hasJapaneseVoice().then((available) => {
      if (active) setVoiceStatus(available ? 'available' : 'missing');
    });
    return () => {
      active = false;
    };
  }, []);

  const pool = useMemo(
    () =>
      getAllKana().filter(
        (kana) =>
          (script === 'both' || kana.script === script) && (group === null || kana.group === group),
      ),
    [script, group],
  );

  const dueCount = useMemo(() => {
    const ids = new Set(pool.map((kana) => kana.id));
    const at = now();
    return progress.filter((item) => ids.has(item.kanaId) && item.seen > 0 && item.dueAt <= at)
      .length;
  }, [pool, progress]);

  const scriptLabel =
    script === 'hiragana'
      ? t('practice.scriptHiragana')
      : script === 'katakana'
        ? t('practice.scriptKatakana')
        : t('practice.scriptBoth');
  const groupLabel =
    group === 'basic'
      ? t('chart.basic')
      : group === 'dakuten'
        ? t('chart.dakuten')
        : group === 'yoon'
          ? t('chart.yoon')
          : '';

  const needsVoice = mode === 'listening' || mode === 'mixed';
  const listeningBlocked = mode === 'listening' && voiceStatus !== 'available';
  const canStart = pool.length > 0 && !listeningBlocked && voiceStatus !== 'checking';

  const chooseMode = (next: ModeChoice) => {
    void tapHaptic(settings.hapticsEnabled);
    setMode(next);
  };

  const start = () => {
    void tapHaptic(settings.hapticsEnabled);
    router.push({
      pathname: '/practice/session',
      params: {
        length: String(length),
        mode,
        script,
        ...(group ? { group } : {}),
      },
    });
  };

  const checkAgain = async () => {
    resetVoiceCache();
    setVoiceStatus('checking');
    const available = await hasJapaneseVoice(true);
    setVoiceStatus(available ? 'available' : 'missing');
  };

  return (
    <Screen edges={TAB_SCREEN_EDGES}>
      <Stack gap={theme.spacing.lg}>
        <Stack gap={2}>
          <AppText variant="title">{t('practice.title')}</AppText>
          <AppText color="textMuted" variant="body">
            {t('practice.subtitle')}
          </AppText>
        </Stack>

        {group ? (
          <Card tone="primarySoft" padding={theme.spacing.sm}>
            <Row align="center" justify="between">
              <AppText variant="label">
                {t('practice.filteredGroup', { group: groupLabel, script: scriptLabel })}
              </AppText>
              <IconButton
                accessibilityLabel={t('common.close')}
                filled={false}
                icon="close"
                onPress={() => setGroup(null)}
                size={18}
              />
            </Row>
          </Card>
        ) : null}

        <Stack gap={theme.spacing.xs}>
          <AppText variant="heading">{t('practice.modePrompt')}</AppText>
          <ModeSelector onSelect={chooseMode} value={mode} />
        </Stack>

        {needsVoice && voiceStatus === 'missing' ? (
          <Card tone="warningSoft">
            <Stack gap={theme.spacing.xs}>
              <Row align="center" gap={theme.spacing.xs}>
                <Icon color="warning" name="volume-mute-outline" size={20} />
                <AppText style={styles.flex} variant="bodyStrong">
                  {t('practice.unavailableTitle')}
                </AppText>
              </Row>
              <AppText color="textMuted" variant="caption">
                {t('practice.unavailableBody')}
              </AppText>
              {mode === 'mixed' ? (
                <AppText color="warning" variant="caption">
                  {t('practice.listeningSkipped')}
                </AppText>
              ) : null}
              <Button
                fullWidth={false}
                label={t('practice.recheck')}
                onPress={() => void checkAgain()}
                size="sm"
                variant="secondary"
              />
            </Stack>
          </Card>
        ) : null}

        <Stack gap={theme.spacing.xs}>
          <AppText variant="heading">{t('practice.script')}</AppText>
          <Segmented
            label={t('practice.script')}
            onChange={(value) => {
              setScript(value);
              if (value === 'both') setGroup(null);
            }}
            options={[
              { label: t('practice.scriptHiragana'), value: 'hiragana' },
              { label: t('practice.scriptKatakana'), value: 'katakana' },
              { label: t('practice.scriptBoth'), value: 'both' },
            ]}
            value={script}
          />
        </Stack>

        <Stack gap={theme.spacing.xs}>
          <AppText variant="heading">{t('practice.length')}</AppText>
          <Segmented
            label={t('practice.length')}
            onChange={setLength}
            options={LENGTHS.map((count) => ({
              label: t('practice.questions', { count }),
              value: count,
            }))}
            value={length}
          />
        </Stack>

        <Card tone="surface2">
          <Row align="center" justify="between">
            <Row align="center" gap={theme.spacing.xs}>
              <Icon color="textMuted" name="time-outline" size={20} />
              <AppText variant="label">
                {group
                  ? t('practice.filteredGroup', { group: groupLabel, script: scriptLabel })
                  : scriptLabel}
              </AppText>
            </Row>
            <Badge
              label={t('practice.dueBadge', { count: dueCount })}
              variant={dueCount > 0 ? 'primary' : 'neutral'}
            />
          </Row>
          {dueCount === 0 ? (
            <AppText color="textMuted" style={styles.spaceTop} variant="caption">
              {t('practice.noDue')}
            </AppText>
          ) : null}
        </Card>

        {listeningBlocked && voiceStatus === 'missing' ? (
          <AppText color="warning" variant="caption">
            {t('practice.ttsUnavailable')}
          </AppText>
        ) : null}

        <Button
          disabled={!canStart}
          icon="play"
          label={t('practice.start')}
          onPress={start}
          size="lg"
        />
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  spaceTop: {
    marginTop: 6,
  },
});
