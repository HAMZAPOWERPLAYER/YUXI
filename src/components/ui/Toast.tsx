import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens } from '@/theme/tokens';

import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';
import { Row } from './Row';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

type ToneAppearance = {
  background: keyof ColorTokens;
  border: keyof ColorTokens;
  icon: IconName;
  iconColor: keyof ColorTokens;
};

const TONES: Record<ToastTone, ToneAppearance> = {
  info: { background: 'infoSoft', border: 'info', icon: 'information-circle', iconColor: 'info' },
  success: {
    background: 'successSoft',
    border: 'success',
    icon: 'checkmark-circle',
    iconColor: 'success',
  },
  warning: {
    background: 'warningSoft',
    border: 'warning',
    icon: 'warning',
    iconColor: 'warning',
  },
  danger: {
    background: 'dangerSoft',
    border: 'danger',
    icon: 'close-circle',
    iconColor: 'danger',
  },
};

export type ToastProps = {
  visible: boolean;
  message: string;
  tone?: ToastTone;
  /** Render in the normal flow instead of as a bottom overlay (gallery/tests). */
  inline?: boolean;
  /** Distance from the bottom edge when overlaid. */
  bottomOffset?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Controlled status message. The parent owns timing, so a screen-reader user is
 * never raced by an internal timer. The live region is polite and the tone is
 * paired with an icon, never colour alone.
 */
export function Toast({
  visible,
  message,
  tone = 'info',
  inline = false,
  bottomOffset = 16,
  style,
  testID,
}: ToastProps) {
  const theme = useAppTheme();
  const appearance = TONES[tone];

  if (!visible) return null;

  return (
    <View
      pointerEvents={inline ? 'auto' : 'box-none'}
      style={[
        inline ? styles.inline : styles.overlay,
        inline ? null : { bottom: bottomOffset },
        style,
      ]}
      testID={testID ? `${testID}-wrap` : undefined}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        style={[
          styles.toast,
          {
            backgroundColor: theme.colors[appearance.background],
            borderColor: theme.colors[appearance.border],
            borderRadius: theme.radii.md,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
          },
        ]}
        testID={testID}
      >
        <Row align="center" gap={theme.spacing.sm}>
          <Icon color={appearance.iconColor} name={appearance.icon} size={theme.sizes.iconMd} />
          <AppText style={styles.message} variant="bodyStrong">
            {message}
          </AppText>
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    alignSelf: 'stretch',
  },
  message: {
    flex: 1,
  },
  overlay: {
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 40,
  },
  toast: {
    borderWidth: 1,
    minHeight: 48,
    width: '100%',
  },
});
