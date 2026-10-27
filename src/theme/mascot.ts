import type { ImageSourcePropType } from 'react-native';

/**
 * Single source of truth for mascot artwork.
 * Replace these five PNGs (keep names/sizes) to swap in final artwork.
 */
export const mascotImages = {
  happy: require('../../assets/mascot/yuxi-happy.png') as ImageSourcePropType,
  thinking: require('../../assets/mascot/yuxi-thinking.png') as ImageSourcePropType,
  sleepy: require('../../assets/mascot/yuxi-sleepy.png') as ImageSourcePropType,
  cheer: require('../../assets/mascot/yuxi-cheer.png') as ImageSourcePropType,
  faceIcon: require('../../assets/mascot/yuxi-face-icon.png') as ImageSourcePropType,
};

export type MascotExpression = 'happy' | 'thinking' | 'sleepy' | 'cheer';

/** Documented expression usage map. */
export const mascotUsage = {
  correctAnswer: 'happy',
  goalMet: 'happy',
  loading: 'thinking',
  quizQuestion: 'thinking',
  emptyState: 'sleepy',
  longAbsence: 'sleepy',
  streakMilestone: 'cheer',
  sessionComplete: 'cheer',
  onboarding: 'happy',
  error: 'thinking',
} as const satisfies Record<string, MascotExpression>;

export function mascotForUsage(usage: keyof typeof mascotUsage): MascotExpression {
  return mascotUsage[usage];
}
