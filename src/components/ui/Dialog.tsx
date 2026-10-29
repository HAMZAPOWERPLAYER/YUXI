import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';
import { Stack } from './Stack';

export type DialogProps = {
  visible: boolean;
  title: string;
  body?: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Uses the danger treatment and a warning icon for irreversible actions. */
  destructive?: boolean;
  /** Keeps the dialog open and marks the confirm button busy while saving. */
  loading?: boolean;
  icon?: IconName;
  testID?: string;
};

/**
 * Confirmation dialog for destructive or high-impact actions. Cancel is always
 * available, the scrim is solid (no blur) and the content is a modal view so a
 * screen reader does not wander into the screen behind it.
 */
export function Dialog({
  visible,
  title,
  body,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  loading = false,
  icon = destructive ? 'warning' : 'help-circle',
  testID,
}: DialogProps) {
  const theme = useAppTheme();

  return (
    <Modal
      animationType={theme.reduceMotion ? 'none' : 'fade'}
      onRequestClose={loading ? undefined : onCancel}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.fill}>
        <Pressable
          accessibilityElementsHidden
          disabled={loading}
          importantForAccessibility="no-hide-descendants"
          onPress={loading ? undefined : onCancel}
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <View pointerEvents="box-none" style={[styles.fill, styles.center]}>
          <View
            accessibilityViewIsModal
            style={[
              styles.dialog,
              {
                backgroundColor: theme.colors.bgElevated,
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radii.lg,
                padding: theme.spacing.lg,
              },
            ]}
            testID={testID}
          >
            <Stack gap={theme.spacing.sm}>
              <Row align="center" gap={theme.spacing.xs}>
                <Icon
                  color={destructive ? 'danger' : 'primaryText'}
                  name={icon}
                  size={theme.sizes.iconLg}
                />
                <AppText style={styles.title} variant="heading">
                  {title}
                </AppText>
              </Row>
              {body ? (
                <AppText color="textMuted" variant="body">
                  {body}
                </AppText>
              ) : null}
              <Row gap={theme.spacing.sm} style={styles.actions}>
                <View style={styles.action}>
                  <Button
                    disabled={loading}
                    label={cancelLabel}
                    onPress={onCancel}
                    testID={testID ? `${testID}-cancel` : undefined}
                    variant="secondary"
                  />
                </View>
                <View style={styles.action}>
                  <Button
                    label={confirmLabel}
                    loading={loading}
                    onPress={onConfirm}
                    testID={testID ? `${testID}-confirm` : undefined}
                    variant={destructive ? 'danger' : 'primary'}
                  />
                </View>
              </Row>
            </Stack>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    flex: 1,
  },
  actions: {
    paddingTop: 4,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    borderWidth: 1,
    maxWidth: 420,
    width: '100%',
  },
  fill: {
    flex: 1,
  },
  title: {
    flex: 1,
  },
});
