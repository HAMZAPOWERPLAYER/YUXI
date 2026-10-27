import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useAppTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: keyof ColorTokens;
};

export function Icon({ name, size = 24, color = 'text' }: IconProps) {
  const theme = useAppTheme();
  return <Ionicons name={name} size={size} color={theme.colors[color]} />;
}
