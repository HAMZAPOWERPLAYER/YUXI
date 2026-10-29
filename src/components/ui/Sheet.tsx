import { type PropsWithChildren, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { Stack } from './Stack';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  /** Localized label for the close button, e.g. `t('common.close')`. */
  closeLabel: string;
  description?: string;
  footer?: ReactNode;
  /** Allows the backdrop and hardware back button to dismiss the sheet. */
  dismissible?: boolean;
  testID?: string;
};

/**
 * Bottom sheet used for short, focused tasks. It uses a solid scrim rather than
 * a blur, keeps the close button at 48dp and lets the sheet scroll when text is
 * scaled up. Focus stays inside because the content is a modal view.
 */
export function Sheet({
  visible,
  onClose,
  title,
  closeLabel,
  description,
  footer,
  dismissible = true,
  children,
  testID,
}: PropsWithChildren<SheetProps>) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, theme.spacing.md);

  return (
    <Modal
      animationType={theme.reduceMotion ? 'none' : 'fade'}
      onRequestClose={dismissible ? onClose : undefined}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.fill}>
        <Pressable
          accessibilityElementsHidden
          disabled={!dismissible}
          importantForAccessibility="no-hide-descendants"
          onPress={dismissible ? onClose : undefined}
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          testID={testID ? `${testID}-backdrop` : undefined}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={styles.fill}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                backgroundColor: theme.colors.bgElevated,
                borderColor: theme.colors.borderStrong,
                borderTopLeftRadius: theme.radii.xl,
                borderTopRightRadius: theme.radii.xl,
                paddingBottom,
              },
            ]}
            testID={testID}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.handle, { backgroundColor: theme.colors.borderStrong }]}
            />
            <Stack
              gap={theme.spacing.md}
              style={[styles.content, { paddingHorizontal: theme.spacing.md }]}
            >
              <View style={styles.header}>
                <Stack gap={theme.spacing.xxs} style={styles.headerText}>
                  <AppText variant="heading">{title}</AppText>
                  {description ? (
                    <AppText color="textMuted" variant="caption">
                      {description}
                    </AppText>
                  ) : null}
                </Stack>
                <IconButton
                  accessibilityLabel={closeLabel}
                  filled={false}
                  icon="close"
                  onPress={onClose}
                  testID={testID ? `${testID}-close` : undefined}
                />
              </View>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
              {footer ? <View>{footer}</View> : null}
            </Stack>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    paddingTop: 4,
  },
  fill: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  handle: {
    alignSelf: 'center',
    borderRadius: 2,
    height: 4,
    marginTop: 8,
    width: 40,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  headerText: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sheet: {
    borderTopWidth: 1,
    maxHeight: '90%',
    paddingTop: 8,
    width: '100%',
  },
});
