import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AppErrorBoundary } from '@/components/AppErrorBoundary';
import { DatabaseErrorScreen } from '@/components/DatabaseErrorScreen';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ProgressProvider } from '@/providers/ProgressProvider';
import { useSettings } from '@/providers/useSettings';
import { AppThemeProvider } from '@/theme/ThemeProvider';
import { useAppFonts } from '@/theme/fonts';

import { RootStack } from './RootStack';

/**
 * Waits for fonts and persisted settings, then mounts the app with the stored
 * theme, text scale and language. A database failure shows a retry screen
 * instead of a blank window.
 */
export function AppRoot() {
  const { fontsReady, fontError } = useAppFonts();
  const { settings, status, retry } = useSettings();
  const ready = fontsReady && status === 'ready';

  useEffect(() => {
    if (fontsReady && status !== 'loading') {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady, status]);

  if (!fontsReady) return null;

  return (
    <AppThemeProvider fontsLoaded={!fontError} mode={settings.theme} textScale={settings.textScale}>
      <AppErrorBoundary source="root">
        {status === 'loading' ? <LoadingScreen /> : null}
        {status === 'error' ? <DatabaseErrorScreen onRetry={retry} /> : null}
        {ready ? (
          <ProgressProvider>
            <RootStack />
          </ProgressProvider>
        ) : null}
      </AppErrorBoundary>
    </AppThemeProvider>
  );
}
