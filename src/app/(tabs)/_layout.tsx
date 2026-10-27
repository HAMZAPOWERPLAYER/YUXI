import { Tabs } from 'expo-router';
import { useMemo } from 'react';

import { useT } from '@/i18n';
import { AppTabBar } from '@/navigation/AppTabBar';

export default function TabsLayout() {
  const t = useT();
  const screens = useMemo(
    () => [
      { name: 'home', title: t('tabs.home') },
      { name: 'learn', title: t('tabs.learn') },
      { name: 'practice', title: t('tabs.practice') },
      { name: 'stats', title: t('tabs.stats') },
      { name: 'settings', title: t('tabs.settings') },
    ],
    [t],
  );

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      {screens.map((screen) => (
        <Tabs.Screen key={screen.name} name={screen.name} options={{ title: screen.title }} />
      ))}
    </Tabs>
  );
}
