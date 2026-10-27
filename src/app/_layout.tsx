import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n';
import { AppRoot } from '@/navigation/AppRoot';
import { SettingsProvider } from '@/providers/SettingsProvider';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash control is best-effort; rendering must never be blocked by it.
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <SettingsProvider>
          <AppRoot />
        </SettingsProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
