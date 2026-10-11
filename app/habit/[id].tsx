import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, TextInput } from 'react-native-paper';

import { archiveHabit, getHabit, saveHabit } from '@/src/database/habits';
import { cancelReminder, inExpoGo, scheduleReminder } from '@/src/notifications';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function HabitForm() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; points?: string; time?: string }>();
  const isNew = params.id === 'new';
  const habitId = isNew ? undefined : Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [points, setPoints] = useState(params.points ?? '');
  const [time, setTime] = useState(params.time ?? '');

  useEffect(() => {
    if (habitId) {
      const h = getHabit(habitId);
      if (h) {
        setName(h.name);
        setPoints(String(h.points));
        setTime(h.reminder_time ?? '');
      }
    }
  }, [habitId]);

  const pointsNum = parseInt(points, 10);
  const pointsValid = Number.isInteger(pointsNum) && pointsNum > 0;
  const timeValid = time === '' || TIME_RE.test(time);
  const canSave = name.trim().length > 0 && pointsValid && timeValid;

  const onSave = async () => {
    const reminder_time = time === '' ? null : time;
    const id = saveHabit({ id: habitId, name: name.trim(), points: pointsNum, reminder_time });
    await scheduleReminder({ id, name: name.trim(), reminder_time });
    router.back();
  };

  const onDelete = async () => {
    if (!habitId) return;
    archiveHabit(habitId);
    await cancelReminder(habitId);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: isNew ? 'New habit' : 'Edit habit' }} />
      <TextInput mode="outlined" label="Habit" value={name} onChangeText={setName} />
      <TextInput
        mode="outlined"
        label="Points per check-in"
        keyboardType="number-pad"
        value={points}
        onChangeText={setPoints}
        error={points !== '' && !pointsValid}
      />
      <TextInput
        mode="outlined"
        label="Reminder time (HH:MM, optional)"
        placeholder="21:00"
        value={time}
        onChangeText={setTime}
        error={!timeValid}
      />
      <HelperText type="error" visible={!timeValid}>
        Use 24h format like 08:30 or 21:00.
      </HelperText>
      <HelperText type="info" visible={inExpoGo}>
        In Expo Go reminders are best-effort; a development build makes them reliable.
      </HelperText>
      <Button mode="contained" disabled={!canSave} onPress={onSave}>
        Save
      </Button>
      {!isNew && (
        <Button mode="outlined" textColor="red" onPress={onDelete}>
          Delete habit
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
});
