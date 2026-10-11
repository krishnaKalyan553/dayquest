import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { Habit, getHabits, getProfileValue, setProfileValue } from './database/habits';

type NotificationsModule = typeof import('expo-notifications');

const CHANNEL_ID = 'habit-reminders';

/**
 * Expo Go (SDK 53+) dropped remote push but local scheduling is still attempted there.
 * Reminders are best-effort in Expo Go and reliable in a development build.
 */
export const inExpoGo = isRunningInExpoGo();

let cached: NotificationsModule | null = null;

function load(): NotificationsModule | null {
  if (!cached) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return cached;
}

export async function ensurePermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: N.AndroidImportance.DEFAULT,
    });
  }
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await N.requestPermissionsAsync();
  return asked.granted;
}

const key = (habitId: number) => `notif_${habitId}`;

export async function cancelReminder(habitId: number) {
  const N = load();
  const id = getProfileValue(key(habitId));
  if (N && id) {
    await N.cancelScheduledNotificationAsync(id);
    setProfileValue(key(habitId), '');
  }
}

/** Schedules (or clears) the daily local reminder for a habit. Inexact daily trigger: no exact-alarm permission needed on Android 14. */
export async function scheduleReminder(habit: Pick<Habit, 'id' | 'name' | 'reminder_time'>): Promise<boolean> {
  try {
    const N = load();
    if (!N) return false;
    await cancelReminder(habit.id);
    if (!habit.reminder_time) return true;
    if (!(await ensurePermission())) return false;

    const [hour, minute] = habit.reminder_time.split(':').map(Number);
    const id = await N.scheduleNotificationAsync({
      content: {
        title: 'Habit time',
        body: `Time for: ${habit.name}`,
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: CHANNEL_ID,
      },
    });
    setProfileValue(key(habit.id), id);
    return true;
  } catch {
    return false;
  }
}

export async function rescheduleAll() {
  for (const habit of getHabits()) {
    await scheduleReminder(habit);
  }
}
