import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox, useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { initializeDatabase } from '@/src/database/database';

initializeDatabase();

// Expo Go logs this when expo-notifications loads; local reminders are unaffected.
LogBox.ignoreLogs(['expo-notifications', 'Android Push notifications']);

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <PaperProvider theme={scheme === 'dark' ? MD3DarkTheme : MD3LightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="habit/[id]" options={{ headerShown: true, title: 'Habit' }} />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
