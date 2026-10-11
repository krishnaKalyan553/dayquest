import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Snackbar, Text, useTheme } from 'react-native-paper';

import { VibeForm } from '@/components/VibeForm';
import { Vibe } from '@/src/ai/AIProvider';
import { inExpoGo, rescheduleAll } from '@/src/notifications';
import { loadVibe, saveVibe } from '@/src/vibe';

export default function SettingsScreen() {
  const theme = useTheme();
  const [vibe, setVibe] = useState<Vibe>(loadVibe());
  const [version, setVersion] = useState(0); // remounts the form when reloaded
  const [toast, setToast] = useState('');

  useFocusEffect(
    useCallback(() => {
      setVibe(loadVibe());
      setVersion((v) => v + 1);
    }, [])
  );

  const onSave = (next: Vibe) => {
    saveVibe(next);
    setVibe(next);
    setToast('Saved. Rewards and messages will follow your profile.');
  };

  const onResync = async () => {
    await rescheduleAll();
    setToast('Reminders refreshed.');
  };

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }} contentContainerStyle={styles.container}>
      <Text variant="titleMedium">About you</Text>
      <Text>The more the app knows, the more your rewards and messages fit you.</Text>
      <VibeForm key={version} initial={vibe} submitLabel="Save" onSubmit={onSave} />

      <Text variant="titleMedium" style={styles.section}>
        Reminders
      </Text>
      <Button mode="outlined" onPress={onResync}>
        Refresh all reminders
      </Button>
      {inExpoGo ? <Text>Running in Expo Go: reminders are best-effort here.</Text> : null}

      <Snackbar visible={!!toast} onDismiss={() => setToast('')} duration={2500}>
        {toast}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  section: { marginTop: 16 },
});
