import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  navy: '#1E3A5F',
  navySoft: '#EAF0F6',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  white: '#FFFFFF',
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          COLORS.navy,

        tabBarInactiveTintColor:
          COLORS.lightMuted,

        tabBarStyle: {
          backgroundColor:
            COLORS.white,

          borderTopColor:
            '#EEF0F3',

          borderTopWidth: 1,

          height: 84,

          paddingTop: 8,
          paddingBottom: 18,

          shadowColor: '#000000',

          shadowOffset: {
            width: 0,
            height: -3,
          },

          shadowOpacity: 0.04,
          shadowRadius: 12,

          elevation: 6,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="classes"
        options={{
          title: 'Klasser',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'school'
                  : 'school-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="recents"
        options={{
          title: 'Historik',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'time'
                  : 'time-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="statistics"
        options={{
          title: 'Statistik',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'stats-chart'
                  : 'stats-chart-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Indstillinger',

          tabBarIcon: ({
            color,
            size,
            focused,
          }) => (
            <Ionicons
              name={
                focused
                  ? 'settings'
                  : 'settings-outline'
              }
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}