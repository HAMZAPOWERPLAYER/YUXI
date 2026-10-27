import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDirection, useT } from '@/i18n';
import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { Row } from './Row';

export type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  large?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({
  title,
  subtitle,
  back = false,
  large = false,
  right,
}: ScreenHeaderProps) {
  const theme = useAppTheme();
  const t = useT();
  const { isRTL } = useDirection();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <Row
      align="center"
      gap={theme.spacing.sm}
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.border,
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
        },
      ]}
    >
      {back ? (
        <IconButton
          accessibilityLabel={t('a11y.back')}
          icon={isRTL ? 'chevron-forward' : 'chevron-back'}
          onPress={goBack}
        />
      ) : null}
      <View style={styles.titleWrap}>
        <AppText accessibilityRole="header" variant={large ? 'title' : 'heading'} numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </Row>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 64,
  },
  titleWrap: {
    flex: 1,
  },
});
