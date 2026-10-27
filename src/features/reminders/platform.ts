/**
 * Local notifications are not implemented on web in this app. Keeping the
 * check pure makes the settings flow easy to test on every CI platform.
 */
export function isReminderPlatformSupported(platform: string): boolean {
  return platform !== 'web';
}
