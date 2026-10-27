import { Image } from 'react-native';

import { useT } from '@/i18n';
import { type MascotExpression, mascotImages } from '@/theme/mascot';

export type MascotProps = {
  expression?: MascotExpression;
  size?: number;
  decorative?: boolean;
  accessibilityLabel?: string;
};

export function Mascot({
  expression = 'happy',
  size = 120,
  decorative = true,
  accessibilityLabel,
}: MascotProps) {
  const t = useT();
  return (
    <Image
      accessibilityIgnoresInvertColors
      accessibilityLabel={decorative ? undefined : (accessibilityLabel ?? t('a11y.mascot'))}
      accessible={!decorative}
      resizeMode="contain"
      source={mascotImages[expression]}
      style={{ height: size, width: size }}
    />
  );
}
