import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { useDirection, useT } from '@/i18n';
import type { TranslationKey } from '@/i18n/types';
import { useAppTheme } from '@/theme/ThemeProvider';

type TabMeta = { labelKey: TranslationKey; icon: IconName };

const TABS: Record<string, TabMeta> = {
  home: { labelKey: 'tabs.home', icon: 'home' },
  learn: { labelKey: 'tabs.learn', icon: 'grid' },
  practice: { labelKey: 'tabs.practice', icon: 'school' },
  stats: { labelKey: 'tabs.stats', icon: 'stats-chart' },
  settings: { labelKey: 'tabs.settings', icon: 'settings' },
};

export function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const theme = useAppTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { isRTL } = useDirection();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const meta = TABS[route.name];
        if (!meta) return null;
        const focused = state.index === index;
        const label = t(meta.labelKey);

        const onPress = () => {
          if (!focused) navigateToTab(route.key);
        };

        return (
          <Pressable
            accessibilityLabel={label}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            key={route.key}
            onPress={onPress}
            style={({ pressed }) => [styles.tab, pressed ? { opacity: 0.72 } : null]}
          >
            <View
              style={[
                styles.iconPill,
                {
                  backgroundColor: focused ? theme.colors.primarySoft : theme.colors.transparent,
                  borderRadius: theme.radii.pill,
                },
              ]}
            >
              <Icon color={focused ? 'primaryText' : 'textMuted'} name={meta.icon} size={22} />
            </View>
            <AppText
              align="center"
              color={focused ? 'primaryText' : 'textMuted'}
              numberOfLines={1}
              variant="caption"
            >
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 6,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 2,
  },
  iconPill: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 52,
  },
});
