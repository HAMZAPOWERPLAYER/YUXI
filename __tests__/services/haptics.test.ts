import * as Haptics from 'expo-haptics';

import { answerHaptic, performHaptic, tapHaptic } from '@/services/haptics';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

const impact = Haptics.impactAsync as jest.Mock;
const notification = Haptics.notificationAsync as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  impact.mockResolvedValue(undefined);
  notification.mockResolvedValue(undefined);
});

describe('performHaptic', () => {
  it('does nothing when haptics are disabled', async () => {
    await performHaptic('success', false);
    expect(impact).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
  });

  it.each(['light', 'medium'] as const)('maps %s to an impact', async (kind) => {
    await performHaptic(kind, true);
    expect(impact).toHaveBeenCalledTimes(1);
  });

  it.each(['success', 'warning', 'error'] as const)('maps %s to a notification', async (kind) => {
    await performHaptic(kind, true);
    expect(notification).toHaveBeenCalledTimes(1);
  });

  it('never throws when the device has no haptic engine', async () => {
    impact.mockRejectedValue(new Error('no engine'));
    notification.mockRejectedValue(new Error('no engine'));
    await expect(performHaptic('light', true)).resolves.toBeUndefined();
    await expect(performHaptic('warning', true)).resolves.toBeUndefined();
  });
});

describe('shortcuts', () => {
  it('taps lightly and answers with success or warning', async () => {
    await tapHaptic(true);
    expect(impact).toHaveBeenCalledTimes(1);
    await answerHaptic(true, true);
    expect(notification).toHaveBeenLastCalledWith('success');
    await answerHaptic(false, true);
    expect(notification).toHaveBeenLastCalledWith('warning');
  });

  it('respects the disabled setting', async () => {
    await tapHaptic(false);
    await answerHaptic(true, false);
    expect(impact).not.toHaveBeenCalled();
    expect(notification).not.toHaveBeenCalled();
  });
});
