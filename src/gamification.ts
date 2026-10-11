import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import { getProfileValue, setProfileValue } from './database/habits';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const MILESTONES = [3, 7, 14, 30, 60, 100];

const TITLES = ['Rookie', 'Starter', 'Regular', 'Committed', 'Disciplined', 'Pro', 'Champion', 'Master', 'Legend', 'Mythic'];

/** XP is total points ever earned, so spending points on rewards never costs you a level. */
export function levelInfo(xp: number) {
  const level = 1 + Math.floor(Math.sqrt(xp / 20));
  const base = 20 * (level - 1) ** 2;
  const next = 20 * level ** 2;
  return {
    level,
    title: TITLES[Math.min(level - 1, TITLES.length - 1)],
    xpIntoLevel: xp - base,
    xpNeeded: next - base,
    progress: (xp - base) / (next - base),
  };
}

export const nextMilestone = (streak: number) => MILESTONES.find((m) => m > streak) ?? null;
export const isMilestone = (streak: number) => MILESTONES.includes(streak);

export function motivation(ctx: { habitCount: number; doneToday: number; activityStreak: number }): string {
  const { habitCount, doneToday, activityStreak } = ctx;
  if (habitCount === 0) return 'Add your first habit below to start a streak.';
  if (doneToday >= habitCount) {
    return activityStreak > 1 ? `Perfect day. Your ${activityStreak}-day streak is safe.` : 'Perfect day. Come back tomorrow to start a streak.';
  }
  if (doneToday === 0) {
    return activityStreak > 0
      ? `Your ${activityStreak}-day streak is on the line. One check-in keeps it alive.`
      : 'Start today: one check-in begins your streak.';
  }
  const remaining = habitCount - doneToday;
  return `${remaining} to go. Finish them all for a perfect day.`;
}

export type Stats = {
  totalCheckIns: number;
  bestStreak: number;
  earned: number;
  redeemed: boolean;
  habitCount: number;
  perfectToday: boolean;
};

export type Achievement = {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  earned: (s: Stats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_step', label: 'First step', hint: 'Complete your first habit', icon: 'shoe-print', earned: (s) => s.totalCheckIns >= 1 },
  { id: 'streak3', label: '3-day streak', hint: 'Check in 3 days in a row', icon: 'fire', earned: (s) => s.bestStreak >= 3 },
  { id: 'streak7', label: 'Week warrior', hint: 'Check in 7 days in a row', icon: 'calendar-week', earned: (s) => s.bestStreak >= 7 },
  { id: 'streak30', label: 'Unstoppable', hint: 'Check in 30 days in a row', icon: 'trophy', earned: (s) => s.bestStreak >= 30 },
  { id: 'full_house', label: 'Perfect day', hint: 'Finish every habit in one day', icon: 'star-circle', earned: (s) => s.perfectToday },
  { id: 'trio', label: 'Building up', hint: 'Track 3 habits at once', icon: 'numeric-3-circle', earned: (s) => s.habitCount >= 3 },
  { id: 'points100', label: 'Century', hint: 'Earn 100 points in total', icon: 'cash-multiple', earned: (s) => s.earned >= 100 },
  { id: 'first_reward', label: 'Treat yourself', hint: 'Redeem your first reward', icon: 'gift', earned: (s) => s.redeemed },
];

/**
 * Unlocks are stored so a badge, once earned, never disappears (e.g. when you later add more habits).
 * Returns every achievement with its status, plus the ones unlocked by this call.
 */
export function syncAchievements(stats: Stats) {
  const fresh: Achievement[] = [];
  const all = ACHIEVEMENTS.map((a) => {
    const key = `ach_${a.id}`;
    let unlocked = !!getProfileValue(key);
    if (!unlocked && a.earned(stats)) {
      setProfileValue(key, new Date().toISOString());
      unlocked = true;
      fresh.push(a);
    }
    return { ...a, unlocked };
  });
  return { all, fresh };
}
