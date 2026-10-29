import { View } from 'react-native';

import { useAppTheme } from '@/theme/ThemeProvider';
import { masteryCues, type ColorTokens, type MasteryLevel } from '@/theme/tokens';

import { Icon } from './Icon';

export type MasteryMarkProps = {
  level: MasteryLevel;
  /** Width and height of the mark in dp. */
  size?: number;
  /** Mark color; defaults to the background so it reads on a filled swatch. */
  color?: keyof ColorTokens;
};

/**
 * Non-color mastery cue so charts stay readable for colour-blind learners:
 * unseen has no mark, learning a dot, familiar a ring and mastered a check.
 * The mark uses the screen background colour for contrast on every tier.
 */
export function MasteryMark({ level, size = 8, color = 'background' }: MasteryMarkProps) {
  const theme = useAppTheme();
  const markColor = theme.colors[color];
  const cue = masteryCues[level];

  if (cue === 'none') return null;

  if (cue === 'check') {
    return <Icon color={color} name="checkmark" size={size + 1} />;
  }

  if (cue === 'ring') {
    return (
      <View
        style={{
          borderColor: markColor,
          borderRadius: size / 2,
          borderWidth: Math.max(1, size / 4),
          height: size,
          width: size,
        }}
      />
    );
  }

  return (
    <View
      style={{
        backgroundColor: markColor,
        borderRadius: size / 2,
        height: size * 0.75,
        width: size * 0.75,
      }}
    />
  );
}
