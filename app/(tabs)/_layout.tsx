import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Klasser',
        }}
      />

      <Tabs.Screen
        name="recents"
        options={{
          title: 'Recents',
        }}
      />
    </Tabs>
  );
}