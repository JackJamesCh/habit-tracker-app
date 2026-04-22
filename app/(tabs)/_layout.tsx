import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useAppTheme } from '@/components/theme-context';
import { getPalette } from '@/constants/design-system';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const { isDark } = useAppTheme();
  const palette = getPalette(isDark);

  // Icon mapping requested for each tab, using outline (inactive) and filled (active) variants.
  const getTabIconName = (
    route: 'habits' | 'logs' | 'targets' | 'insights' | 'account' | 'categories',
    focused: boolean
  ): IoniconName => {
    const icons: Record<typeof route, { active: IoniconName; inactive: IoniconName }> = {
      habits: { inactive: 'home-outline', active: 'home' },
      logs: { inactive: 'list-outline', active: 'list' },
      targets: { inactive: 'flag-outline', active: 'flag' },
      insights: { inactive: 'bar-chart-outline', active: 'bar-chart' },
      account: { inactive: 'person-outline', active: 'person' },
      categories: { inactive: 'grid-outline', active: 'grid' },
    };

    return focused ? icons[route].active : icons[route].inactive;
  };

  // Active/inactive tab behavior:
  // - Active uses primary color + slightly larger icon + bold label
  // - Inactive uses muted theme color
  const renderTabLabel = (label: string) =>
    ({ focused, color }: { focused: boolean; color: string }) => (
      <Text
        style={{
          color,
          fontSize: 11,
          fontWeight: focused ? '700' : '500',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    );

  return (
    <Tabs
      screenOptions={{
        // Styling reference requested by user:
        // https://reactnativecomponents.com/components/tab
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.tabBarBackground,
          borderTopWidth: 0,
          height: 76,
          paddingTop: 6,
          paddingBottom: 10,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.08,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 2,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarLabel: renderTabLabel('Habits'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('habits', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarLabel: renderTabLabel('Logs'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('logs', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="targets"
        options={{
          title: 'Targets',
          tabBarLabel: renderTabLabel('Targets'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('targets', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          tabBarLabel: renderTabLabel('Insights'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('insights', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarLabel: renderTabLabel('Account'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('account', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarLabel: renderTabLabel('Categories'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={focused ? 26 : 22}
              name={getTabIconName('categories', focused)}
              color={color}
              style={{ marginTop: 2 }}
            />
          ),
        }}
      />
    </Tabs>
  );
}