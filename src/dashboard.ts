import { getHabits, getRewards } from './database/habits';
import {
  LedgerEntry,
  getActivityStreak,
  getBalance,
  getBestActivityStreak,
  getCheckInCount,
  getDailyCheckIns,
  getHabitWeek,
  getLedger,
  getLongestStreak,
  getStreak,
  getTotalCheckIns,
  getTotalEarned,
  getTotalSpent,
  activeCheckInToday,
  hasRedeemed,
} from './database/ledger';
import { levelInfo, nextMilestone, syncAchievements } from './gamification';

export type HabitStat = {
  id: number;
  name: string;
  points: number;
  reminderTime: string | null;
  entryId: number | null; // today's active check-in, if any
  streak: number;
  longest: number;
  total: number;
  nextMilestone: number | null;
  week: { day: string; done: boolean }[];
};

export type Data = {
  balance: number;
  earned: number;
  spent: number;
  habitCount: number;
  doneToday: number;
  days: { day: string; count: number }[]; // last 28 days, oldest first
  habits: HabitStat[];
  nextReward: { name: string; cost: number } | null;
  ledger: LedgerEntry[];
  level: ReturnType<typeof levelInfo>;
  activityStreak: number;
  bestActivityStreak: number;
  achievements: ReturnType<typeof syncAchievements>['all'];
  newAchievements: ReturnType<typeof syncAchievements>['fresh'];
};

export function loadData(): Data {
  const habits = getHabits();
  const balance = getBalance();
  const earned = getTotalEarned();
  const days = getDailyCheckIns(28);
  const doneToday = days[days.length - 1]?.count ?? 0;
  const rewards = getRewards();

  // The cheapest reward you can't afford yet, otherwise the most expensive one you can.
  const unaffordable = rewards.filter((r) => r.cost > balance).sort((a, b) => a.cost - b.cost)[0];
  const affordable = rewards.filter((r) => r.cost <= balance).sort((a, b) => b.cost - a.cost)[0];
  const next = unaffordable ?? affordable ?? null;

  const bestActivityStreak = getBestActivityStreak();
  const { all, fresh } = syncAchievements({
    totalCheckIns: getTotalCheckIns(),
    bestStreak: bestActivityStreak,
    earned,
    redeemed: hasRedeemed(),
    habitCount: habits.length,
    perfectToday: habits.length > 0 && doneToday >= habits.length,
  });

  return {
    balance,
    earned,
    spent: getTotalSpent(),
    habitCount: habits.length,
    doneToday,
    days,
    habits: habits.map((h) => {
      const streak = getStreak(h.id);
      return {
        id: h.id,
        name: h.name,
        points: h.points,
        reminderTime: h.reminder_time,
        entryId: activeCheckInToday(h.id),
        streak,
        longest: getLongestStreak(h.id),
        total: getCheckInCount(h.id),
        nextMilestone: nextMilestone(streak),
        week: getHabitWeek(h.id, 7),
      };
    }),
    nextReward: next ? { name: next.name, cost: next.cost } : null,
    ledger: getLedger(100),
    level: levelInfo(earned),
    activityStreak: getActivityStreak(),
    bestActivityStreak,
    achievements: all,
    newAchievements: fresh,
  };
}
