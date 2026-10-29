import { type PropsWithChildren, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/ThemeProvider';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  edges?: readonly Edge[];
  verticalPadding?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const DEFAULT_EDGES: readonly Edge[] = ['top', 'bottom', 'left', 'right'];

/** Tab screens sit above the custom tab bar, which owns the bottom inset. */
export const TAB_SCREEN_EDGES: readonly Edge[] = ['top', 'left', 'right'];

/** Standard screen shell. System-bar styling is owned by the navigation root. */
export function Screen({
  children,
  scroll = true,
  padded = true,
  header,
  footer,
  edges = DEFAULT_EDGES,
  verticalPadding = true,
  contentContainerStyle,
  style,
  testID,
}: PropsWithChildren<ScreenProps>) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safe, { backgroundColor: theme.colors.background }, style]}
      testID={testID}
    >
      {header}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            padded ? { paddingHorizontal: theme.spacing.md } : null,
            verticalPadding ? { paddingVertical: theme.spacing.md } : null,
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.fill,
            padded ? { paddingHorizontal: theme.spacing.md } : null,
            verticalPadding ? { paddingVertical: theme.spacing.md } : null,
            contentContainerStyle,
          ]}
        >
          {children}
        </View>
      )}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  fill: {
    flex: 1,
  },
});
