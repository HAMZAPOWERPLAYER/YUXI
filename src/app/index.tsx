import { Redirect } from 'expo-router';

import { useSettings } from '@/providers/useSettings';

/** Chooses the first screen based on whether onboarding has been finished. */
export default function IndexRoute() {
  const { settings } = useSettings();
  return <Redirect href={settings.onboardingDone ? '/(tabs)/home' : '/onboarding'} />;
}
