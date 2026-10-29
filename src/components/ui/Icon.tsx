import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { useAppTheme } from '@/theme/ThemeProvider';
import { type ColorTokens, sizes } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];
export type IconSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export type IconProps = {
  name: IconName;
  size?: IconSize;
  color?: keyof ColorTokens;
};

export const iconSizes = {
  sm: sizes.iconSm,
  md: sizes.iconMd,
  lg: sizes.iconLg,
  xl: sizes.iconXl,
} as const;

export function resolveIconSize(size: IconSize): number {
  return typeof size === 'number' ? size : iconSizes[size];
}

/** One icon family app-wide: Ionicons. */
export function Icon({ name, size = 'lg', color = 'text' }: IconProps) {
  const theme = useAppTheme();
  return <Ionicons name={name} size={resolveIconSize(size)} color={theme.colors[color]} />;
}
