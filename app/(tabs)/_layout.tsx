import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { useTheme } from 'react-native-paper';

import { isOnboarded } from '@/src/vibe';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const tab = (title: string, icon: IconName) => ({
  title,
  tabBarIcon: ({ color, size }: { color: string; size: number }) => (
    <MaterialCommunityIcons name={icon} color={color} size={size} />
  ),
});

export default function TabLayout() {
  const theme = useTheme();
  // First run: send the user to onboarding. Done here (inside the navigator) rather than in the root layout.
  if (!isOnboarded()) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        tabBarStyle: { backgroundColor: theme.colors.surface },
      }}>
      <Tabs.Screen name="index" options={tab('Home', 'home-outline')} />
      <Tabs.Screen name="rewards" options={tab('Rewards', 'gift-outline')} />
      <Tabs.Screen name="settings" options={tab('Settings', 'cog-outline')} />
    </Tabs>
  );
}
