import { Stack } from 'expo-router';

export default function StatisticsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="classes" />
      <Stack.Screen name="students/index" />
      <Stack.Screen name="students/[studentId]" />
    </Stack>
  );
}