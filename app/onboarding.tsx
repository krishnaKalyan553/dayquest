import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { VibeForm } from '@/components/VibeForm';
import { loadVibe, saveVibe } from '@/src/vibe';

export default function Onboarding() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text variant="headlineMedium">Make it yours</Text>
      <Text>
        Good habits earn points, and you decide what the points buy. Tell the app what kind of person you are so rewards
        and messages fit you. You can change this any time.
      </Text>
      <VibeForm
        initial={loadVibe()}
        submitLabel="Let's go"
        onSubmit={(vibe) => {
          saveVibe(vibe);
          router.replace('/(tabs)');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, paddingTop: 64 },
});
