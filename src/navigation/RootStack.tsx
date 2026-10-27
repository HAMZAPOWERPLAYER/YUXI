import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useSettings } from '@/providers/useSettings';
import { useAppTheme } from '@/theme/ThemeProvider';

/** Root navigator. Headers are custom so every screen can respect RTL. */
export function RootStack() {
  const theme = useAppTheme();
  const { settings } = useSettings();

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: 'slide_from_left',
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="learn/[script]" />
        <Stack.Screen name="kana/[id]" />
        <Stack.Screen
          name="practice/session"
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen
          name="practice/summary"
          options={{ animation: 'fade', gestureEnabled: false }}
        />
        <Stack.Screen name="about" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="licenses" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
