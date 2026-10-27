import { StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';

export function Divider({ inset = 0 }: { inset?: number }) {
  const theme = useAppTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.base, { backgroundColor: theme.colors.border, marginHorizontal: inset }]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
