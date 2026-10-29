import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useDirection } from '@/i18n';
import { useSettings } from '@/providers/useSettings';
import { useAppTheme } from '@/theme/ThemeProvider';

/** Root navigator. Headers are custom so every screen can respect RTL. */
export function RootStack() {
  const theme = useAppTheme();
  const { isRTL } = useDirection();
  const { settings } = useSettings();
  const pushAnimation = theme.reduceMotion
    ? 'none'
    : isRTL
      ? 'slide_from_left'
      : 'slide_from_right';
  const fadeAnimation = theme.reduceMotion ? 'none' : 'fade';

  return (
    <>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          animation: pushAnimation,
          contentStyle: { backgroundColor: theme.colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="onboarding"
          options={{ animation: fadeAnimation, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ animation: fadeAnimation }} />
        <Stack.Screen name="learn/[script]" />
        <Stack.Screen name="course/index" />
        <Stack.Screen name="course/[unitId]" />
        <Stack.Screen
          name="lesson/[lessonId]"
          options={{ animation: fadeAnimation, gestureEnabled: false }}
        />
        <Stack.Screen name="kana/[id]" />
        <Stack.Screen
          name="practice/session"
          options={{ animation: fadeAnimation, gestureEnabled: false }}
        />
        <Stack.Screen
          name="practice/summary"
          options={{ animation: fadeAnimation, gestureEnabled: false }}
        />
        <Stack.Screen name="about" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="licenses" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
