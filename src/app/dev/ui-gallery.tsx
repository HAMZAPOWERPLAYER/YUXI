import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/ScreenHeader';
import {
  AppText,
  Badge,
  Button,
  Card,
  Chip,
  Dialog,
  EmptyState,
  GlowView,
  IconButton,
  ListRow,
  MoodMascot,
  OptionButton,
  ProgressBar,
  ProgressRing,
  Row,
  Screen,
  Sheet,
  Skeleton,
  SpeechBubble,
  Stack,
  Toast,
  WavePattern,
} from '@/components/ui';
import { useI18n, useT, type TranslationKey } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens } from '@/theme/tokens';

const PALETTE: readonly { token: keyof ColorTokens; label: TranslationKey }[] = [
  { token: 'background', label: 'devGallery.colorBackground' },
  { token: 'surface', label: 'devGallery.colorSurface' },
  { token: 'primary', label: 'devGallery.colorPrimary' },
  { token: 'success', label: 'devGallery.colorSuccess' },
  { token: 'warning', label: 'devGallery.colorWarning' },
  { token: 'danger', label: 'devGallery.colorDanger' },
  { token: 'text', label: 'devGallery.colorText' },
  { token: 'textMuted', label: 'devGallery.colorMuted' },
];

type DialogMode = 'confirm' | 'destructive' | null;

function GalleryContent() {
  const t = useT();
  const theme = useAppTheme();
  const { language, setLanguage } = useI18n();
  const [toastVisible, setToastVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const noop = () => undefined;

  return (
    <>
      <Screen header={<ScreenHeader back title={t('devGallery.title')} />}>
        <Stack gap={theme.spacing.lg}>
          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText variant="heading">{t('devGallery.title')}</AppText>
              <AppText color="textMuted" variant="body">
                {t('devGallery.subtitle')}
              </AppText>
              <AppText color="textMuted" variant="label">
                {t('devGallery.language')}
              </AppText>
              <Row gap={theme.spacing.xs}>
                <Chip
                  label={t('devGallery.english')}
                  onPress={() => setLanguage('en')}
                  selected={language === 'en'}
                />
                <Chip
                  label={t('devGallery.urdu')}
                  onPress={() => setLanguage('ur')}
                  selected={language === 'ur'}
                />
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.palette')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.paletteBody')}
              </AppText>
              <Row gap={theme.spacing.sm} wrap>
                {PALETTE.map(({ token, label }) => {
                  const name = t(label);
                  return (
                    <Stack
                      accessibilityLabel={name}
                      accessible
                      gap={theme.spacing.xxs}
                      key={token}
                      style={styles.swatchItem}
                    >
                      <View
                        style={[
                          styles.swatch,
                          {
                            backgroundColor: theme.colors[token],
                            borderColor: theme.colors.borderStrong,
                            borderRadius: theme.radii.sm,
                          },
                        ]}
                      />
                      <AppText color="textMuted" variant="caption">
                        {name}
                      </AppText>
                    </Stack>
                  );
                })}
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.typography')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.typographyBody')}
              </AppText>
              <AppText variant="display">{t('devGallery.title')}</AppText>
              <AppText variant="heading">{t('devGallery.actions')}</AppText>
              <AppText variant="body">{t('common.brandTagline')}</AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.typographyBody')}
              </AppText>
              <AppText lang="ja" variant="kanaLarge">
                {t('devGallery.japaneseSample')}
              </AppText>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.actions')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.actionsBody')}
              </AppText>
              <Button label={t('devGallery.primary')} onPress={noop} />
              <Button label={t('devGallery.secondary')} onPress={noop} variant="secondary" />
              <Button label={t('devGallery.ghost')} onPress={noop} variant="ghost" />
              <Button label={t('devGallery.danger')} onPress={noop} variant="danger" />
              <Row gap={theme.spacing.sm}>
                <IconButton
                  accessibilityLabel={t('a11y.settings')}
                  icon="settings-outline"
                  onPress={noop}
                />
                <IconButton
                  accessibilityLabel={t('settings.reminder')}
                  icon="notifications-outline"
                  onPress={noop}
                />
                <IconButton
                  accessibilityLabel={t('a11y.mascot')}
                  icon="heart-outline"
                  onPress={noop}
                />
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.chipsBadges')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.chipsBadgesBody')}
              </AppText>
              <Row gap={theme.spacing.xs} wrap>
                <Chip label={t('devGallery.chipSelected')} selected />
                <Chip label={t('devGallery.chipIdle')} />
              </Row>
              <Row gap={theme.spacing.xs} wrap>
                <Badge icon="information-circle" label={t('devGallery.badgeInfo')} variant="info" />
                <Badge
                  icon="checkmark-circle"
                  label={t('devGallery.badgeSuccess')}
                  variant="success"
                />
                <Badge icon="warning" label={t('devGallery.badgeWarning')} variant="warning" />
                <Badge icon="close-circle" label={t('devGallery.badgeDanger')} variant="danger" />
              </Row>
              <Row gap={theme.spacing.xs} wrap>
                <Badge label={t('stats.legendUnseen')} size="sm" variant="neutral" />
                <Badge label={t('stats.legendLearning')} size="sm" variant="warning" />
                <Badge label={t('stats.legendFamiliar')} size="sm" variant="info" />
                <Badge label={t('stats.legendMastered')} size="sm" variant="success" />
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.md}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.progress')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.progressBody')}
              </AppText>
              <ProgressBar accessibilityLabel={t('devGallery.progressBody')} progress={0.64} />
              <Row gap={theme.spacing.md} justify="center">
                <GlowView size={172} style={styles.ringGlow}>
                  <ProgressRing
                    accessibilityLabel={t('devGallery.progressBody')}
                    progress={0.68}
                    size={132}
                  >
                    <AppText variant="title">{t('common.percent', { percent: 68 })}</AppText>
                  </ProgressRing>
                </GlowView>
              </Row>
              <Row gap={theme.spacing.sm} justify="center">
                <ProgressRing progress={0.25} size={64} strokeWidth={7}>
                  <AppText color="textMuted" variant="caption">
                    {t('common.percent', { percent: 25 })}
                  </AppText>
                </ProgressRing>
                <ProgressRing progress={1} size={64} strokeWidth={7}>
                  <AppText color="success" variant="caption">
                    {t('common.percent', { percent: 100 })}
                  </AppText>
                </ProgressRing>
              </Row>
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.loading')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.loadingBody')}
              </AppText>
              <Skeleton height={20} width="88%" />
              <Skeleton height={14} width="72%" />
              <Skeleton height={14} width="54%" />
            </Stack>
          </Card>

          <Card>
            <Stack gap={theme.spacing.md}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.companion')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.companionBody')}
              </AppText>
              <Row gap={theme.spacing.md}>
                <MoodMascot mood="success" size={104} />
                <SpeechBubble
                  message={t('devGallery.companionBody')}
                  style={styles.bubble}
                  testID="gallery-bubble"
                />
              </Row>
              <AppText color="textMuted" variant="label">
                {t('devGallery.speech')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.speechBody')}
              </AppText>
              <SpeechBubble message={t('devGallery.speechBody')} tail="end" />
            </Stack>
          </Card>

          <Card padding={0}>
            <Stack gap={theme.spacing.sm} style={{ padding: theme.spacing.md }}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.motif')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.motifBody')}
              </AppText>
            </Stack>
            <WavePattern color="primaryBright" height={88} opacity={0.12} />
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.options')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.optionsBody')}
              </AppText>
              <Row gap={theme.spacing.sm} wrap>
                <OptionButton
                  accessibilityLabel={t('devGallery.optionIdle')}
                  caption={t('devGallery.optionCaption')}
                  label={t('devGallery.optionIdle')}
                  onPress={noop}
                  style={styles.option}
                />
                <OptionButton
                  accessibilityLabel={t('devGallery.optionSelected')}
                  label={t('devGallery.optionSelected')}
                  onPress={noop}
                  state="selected"
                  style={styles.option}
                />
                <OptionButton
                  accessibilityLabel={t('a11y.optionCorrect', {
                    text: t('devGallery.optionCorrect'),
                  })}
                  label={t('devGallery.optionCorrect')}
                  onPress={noop}
                  state="correct"
                  style={styles.option}
                />
                <OptionButton
                  accessibilityLabel={t('a11y.optionWrong', {
                    text: t('devGallery.optionWrong'),
                  })}
                  label={t('devGallery.optionWrong')}
                  onPress={noop}
                  state="wrong"
                  style={styles.option}
                />
                <OptionButton
                  accessibilityLabel={t('devGallery.optionDisabled')}
                  label={t('devGallery.optionDisabled')}
                  onPress={noop}
                  state="disabled"
                  style={styles.option}
                />
              </Row>
            </Stack>
          </Card>

          <EmptyState
            actionLabel={t('devGallery.emptyAction')}
            body={t('devGallery.emptyBody')}
            expression="sleepy"
            onAction={() => setToastVisible(true)}
            title={t('devGallery.emptyTitle')}
          />

          <Card padding={0}>
            <Stack gap={theme.spacing.xs} style={{ padding: theme.spacing.md }}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.list')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.listBody')}
              </AppText>
            </Stack>
            <ListRow
              description={t('devGallery.rowDescription')}
              icon="settings-outline"
              last
              onPress={() => setToastVisible(true)}
              title={t('devGallery.rowTitle')}
            />
          </Card>

          <Card>
            <Stack gap={theme.spacing.sm}>
              <AppText accessibilityRole="header" variant="heading">
                {t('devGallery.feedback')}
              </AppText>
              <AppText color="textMuted" variant="caption">
                {t('devGallery.feedbackBody')}
              </AppText>
              <Button
                icon="notifications-outline"
                label={t('devGallery.showToast')}
                onPress={() => setToastVisible(true)}
                variant="secondary"
              />
              <Button
                icon="albums-outline"
                label={t('devGallery.openSheet')}
                onPress={() => setSheetOpen(true)}
                variant="secondary"
              />
              <Button
                icon="help-circle-outline"
                label={t('devGallery.openDialog')}
                onPress={() => setDialogMode('confirm')}
                variant="secondary"
              />
              <Button
                icon="warning-outline"
                label={t('devGallery.openDestructive')}
                onPress={() => setDialogMode('destructive')}
                variant="danger"
              />
            </Stack>
          </Card>
        </Stack>
      </Screen>

      <Toast
        bottomOffset={24}
        message={t('devGallery.toastMessage')}
        testID="gallery-toast"
        visible={toastVisible}
      />

      <Sheet
        closeLabel={t('common.close')}
        footer={<Button label={t('common.done')} onPress={() => setSheetOpen(false)} />}
        onClose={() => setSheetOpen(false)}
        testID="gallery-sheet"
        title={t('devGallery.sheetTitle')}
        visible={sheetOpen}
      >
        <Stack gap={theme.spacing.md}>
          <AppText variant="body">{t('devGallery.sheetBody')}</AppText>
          <Skeleton height={48} />
        </Stack>
      </Sheet>

      <Dialog
        body={t('devGallery.dialogBody')}
        cancelLabel={t('common.cancel')}
        confirmLabel={
          dialogMode === 'destructive' ? t('devGallery.confirmDelete') : t('common.confirm')
        }
        destructive={dialogMode === 'destructive'}
        onCancel={() => setDialogMode(null)}
        onConfirm={() => setDialogMode(null)}
        testID="gallery-dialog"
        title={t('devGallery.dialogTitle')}
        visible={dialogMode !== null}
      />
    </>
  );
}

export default function UiGalleryScreen() {
  if (!__DEV__) {
    return <Redirect href="/" />;
  }
  return <GalleryContent />;
}

const styles = StyleSheet.create({
  bubble: {
    flex: 1,
  },
  option: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  ringGlow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  swatchItem: {
    minWidth: 64,
  },
});
