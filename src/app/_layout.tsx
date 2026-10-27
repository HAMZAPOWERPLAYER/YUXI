import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { I18nProvider } from '@/i18n';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { useAppFonts } from '@/theme/fonts';

void SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash control is best-effort; rendering must never be blocked by it.
});

export default function RootLayout() {
  const { fontsReady, fontError } = useAppFonts();

  useEffect(() => {
    if (fontsReady) {
      void SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AppThemeProvider fontsLoaded={!fontError}>
          <AppErrorBoundary source="root">
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
          </AppErrorBoundary>
        </AppThemeProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
