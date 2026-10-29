import type { ImageSourcePropType } from 'react-native';

/**
 * Single source of truth for mascot artwork.
 * Replace these WebP assets (keep names/sizes) to swap in final artwork.
 */
export const mascotImages = {
  happy: require('../../assets/mascot/yuxi-happy.webp') as ImageSourcePropType,
  thinking: require('../../assets/mascot/yuxi-thinking.webp') as ImageSourcePropType,
  sleepy: require('../../assets/mascot/yuxi-sleepy.webp') as ImageSourcePropType,
  cheer: require('../../assets/mascot/yuxi-cheer.webp') as ImageSourcePropType,
  calm: require('../../assets/mascot/yuxi-calm.webp') as ImageSourcePropType,
  encourage: require('../../assets/mascot/yuxi-encourage.webp') as ImageSourcePropType,
};

export type MascotExpression = 'happy' | 'thinking' | 'sleepy' | 'cheer' | 'calm' | 'encourage';

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
