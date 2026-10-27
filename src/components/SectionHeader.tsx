import type { ReactNode } from 'react';

import { useAppTheme } from '@/theme/ThemeProvider';

import { AppText } from './AppText';
import { Row } from './Row';
import { Stack } from './Stack';

export type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
};

export function SectionHeader({ title, subtitle, right }: SectionHeaderProps) {
  const theme = useAppTheme();
  return (
    <Row gap={theme.spacing.sm} justify="between" align="start">
      <Stack gap={2} style={{ flex: 1 }}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="body" color="textMuted">
            {subtitle}
          </AppText>
        ) : null}
      </Stack>
      {right}
    </Row>
  );
}
