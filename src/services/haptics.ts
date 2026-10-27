import * as Haptics from 'expo-haptics';

import { logEvent } from '@/utils/logger';

export type HapticKind = 'light' | 'medium' | 'success' | 'warning' | 'error';

/**
 * Optional tactile feedback. Every call is guarded: a device without a haptic
 * engine (or a user who disabled the setting) must never break a quiz answer.
 */
export async function performHaptic(kind: HapticKind, enabled: boolean): Promise<void> {
  if (!enabled) return;
  try {
    switch (kind) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    logEvent('debug', `Haptic feedback failed: ${kind}`, error);
  }
}

/** Shortcut used by option buttons and the primary action. */
export function tapHaptic(enabled: boolean): Promise<void> {
  return performHaptic('light', enabled);
}

export function answerHaptic(correct: boolean, enabled: boolean): Promise<void> {
  return performHaptic(correct ? 'success' : 'warning', enabled);
}
