import { db } from './database';

export type LedgerType = 'CHECKIN' | 'REDEEM' | 'REVERSAL';

export type LedgerEntry = {
  id: number;
  ts: string;
  day: string;
  type: LedgerType;
  habit_id: number | null;
  reward_id: number | null;
  label: string;
  points: number;
  reverses_id: number | null;
  reversed: number; // 1 if a REVERSAL points at this entry
};

export type Result = { ok: true } | { ok: false; error: string };

/** Local calendar day as YYYY-MM-DD. */
export function dayString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getBalance(): number {
  const row = db.getFirstSync<{ total: number | null }>('SELECT SUM(points) AS total FROM ledger');
  return row?.total ?? 0;
}

/** Id of today's active (non-reversed) check-in for a habit, or null. */
export function activeCheckInToday(habitId: number): number | null {
  const row = db.getFirstSync<{ id: number }>(
    `SELECT l.id FROM ledger l
     WHERE l.type = 'CHECKIN' AND l.habit_id = ? AND l.day = ?
       AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`,
    habitId,
    dayString()
  );
  return row?.id ?? null;
}

export function checkIn(habitId: number): Result {
  let result: Result = { ok: true };
  db.withTransactionSync(() => {
    const habit = db.getFirstSync<{ name: string; points: number; archived: number }>(
      'SELECT name, points, archived FROM habits WHERE id = ?',
      habitId
    );
    if (!habit || habit.archived) {
      result = { ok: false, error: 'Habit not found.' };
      return;
    }
    if (activeCheckInToday(habitId) !== null) {
      result = { ok: false, error: 'Already checked in today.' };
      return;
    }
    const now = new Date();
    db.runSync(
      `INSERT INTO ledger (ts, day, type, habit_id, label, points) VALUES (?, ?, 'CHECKIN', ?, ?, ?)`,
      now.toISOString(),
      dayString(now),
      habitId,
      habit.name,
      habit.points
    );
  });
  return result;
}

export function redeem(rewardId: number): Result {
  let result: Result = { ok: true };
  db.withTransactionSync(() => {
    const reward = db.getFirstSync<{ name: string; cost: number; archived: number }>(
      'SELECT name, cost, archived FROM rewards WHERE id = ?',
      rewardId
    );
    if (!reward || reward.archived) {
      result = { ok: false, error: 'Reward not found.' };
      return;
    }
    if (getBalance() < reward.cost) {
      result = { ok: false, error: 'Not enough points.' };
      return;
    }
    const now = new Date();
    db.runSync(
      `INSERT INTO ledger (ts, day, type, reward_id, label, points) VALUES (?, ?, 'REDEEM', ?, ?, ?)`,
      now.toISOString(),
      dayString(now),
      rewardId,
      reward.name,
      -reward.cost
    );
  });
  return result;
}

/** Same-day undo: appends an exact negation of the entry. Never edits or deletes history. */
export function undo(entryId: number): Result {
  let result: Result = { ok: true };
  db.withTransactionSync(() => {
    const entry = db.getFirstSync<{
      id: number;
      type: LedgerType;
      day: string;
      habit_id: number | null;
      reward_id: number | null;
      label: string;
      points: number;
    }>('SELECT id, type, day, habit_id, reward_id, label, points FROM ledger WHERE id = ?', entryId);
    if (!entry) {
      result = { ok: false, error: 'Entry not found.' };
      return;
    }
    if (entry.type === 'REVERSAL') {
      result = { ok: false, error: 'An undo cannot be undone.' };
      return;
    }
    if (entry.day !== dayString()) {
      result = { ok: false, error: 'Only today’s entries can be undone.' };
      return;
    }
    const already = db.getFirstSync('SELECT 1 FROM ledger WHERE reverses_id = ?', entryId);
    if (already) {
      result = { ok: false, error: 'Already undone.' };
      return;
    }
    if (getBalance() - entry.points < 0) {
      result = { ok: false, error: 'Those points were already spent.' };
      return;
    }
    const now = new Date();
    db.runSync(
      `INSERT INTO ledger (ts, day, type, habit_id, reward_id, label, points, reverses_id)
       VALUES (?, ?, 'REVERSAL', ?, ?, ?, ?, ?)`,
      now.toISOString(),
      dayString(now),
      entry.habit_id,
      entry.reward_id,
      `Undo: ${entry.label}`,
      -entry.points,
      entry.id
    );
  });
  return result;
}

export function getLedger(limit = 100): LedgerEntry[] {
  return db.getAllSync<LedgerEntry>(
    `SELECT l.*, EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id) AS reversed
     FROM ledger l ORDER BY l.id DESC LIMIT ?`,
    limit
  );
}

/** Days (YYYY-MM-DD) with an active check-in for the habit. */
function activeDays(habitId: number): Set<string> {
  const rows = db.getAllSync<{ day: string }>(
    `SELECT DISTINCT l.day FROM ledger l
     WHERE l.type = 'CHECKIN' AND l.habit_id = ?
       AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`,
    habitId
  );
  return new Set(rows.map((r) => r.day));
}

/** Consecutive days with a check-in, ending today (or yesterday if today isn't done yet). */
export function getStreak(habitId: number): number {
  const days = activeDays(habitId);
  const cursor = new Date();
  if (!days.has(dayString(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Active check-ins per day for the last `days` days (oldest first). */
export function getDailyCheckIns(days = 7): { day: string; count: number }[] {
  const out: { day: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    const day = dayString(cursor);
    const row = db.getFirstSync<{ c: number }>(
      `SELECT COUNT(*) AS c FROM ledger l
       WHERE l.type = 'CHECKIN' AND l.day = ?
         AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`,
      day
    );
    out.push({ day, count: row?.c ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function getTotalEarned(): number {
  const row = db.getFirstSync<{ t: number | null }>(
    `SELECT SUM(points) AS t FROM ledger l
     WHERE l.type = 'CHECKIN' AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`
  );
  return row?.t ?? 0;
}

export function getTotalSpent(): number {
  const row = db.getFirstSync<{ t: number | null }>(
    `SELECT SUM(-points) AS t FROM ledger l
     WHERE l.type = 'REDEEM' AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`
  );
  return row?.t ?? 0;
}

/** Whether the habit was done on each of the last `days` days (oldest first). */
export function getHabitWeek(habitId: number, days = 7): { day: string; done: boolean }[] {
  const done = activeDays(habitId);
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (days - 1));
  const out: { day: string; done: boolean }[] = [];
  for (let i = 0; i < days; i += 1) {
    const day = dayString(cursor);
    out.push({ day, done: done.has(day) });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export function getCheckInCount(habitId: number): number {
  return activeDays(habitId).size;
}

/** Longest run of consecutive check-in days ever recorded for the habit. */
export function getLongestStreak(habitId: number): number {
  const sorted = [...activeDays(habitId)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of sorted) {
    const date = new Date(`${day}T00:00:00`);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

/** Days (YYYY-MM-DD) on which at least one habit was checked in (not undone). */
function anyActiveDays(): Set<string> {
  const rows = db.getAllSync<{ day: string }>(
    `SELECT DISTINCT l.day FROM ledger l
     WHERE l.type = 'CHECKIN'
       AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`
  );
  return new Set(rows.map((r) => r.day));
}

/** Consecutive days with any check-in, ending today (or yesterday if today isn't done yet). */
export function getActivityStreak(): number {
  const days = anyActiveDays();
  const cursor = new Date();
  if (!days.has(dayString(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getBestActivityStreak(): number {
  const sorted = [...anyActiveDays()].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const day of sorted) {
    const date = new Date(`${day}T00:00:00`);
    run = prev && Math.round((date.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function getTotalCheckIns(): number {
  const row = db.getFirstSync<{ c: number }>(
    `SELECT COUNT(*) AS c FROM ledger l
     WHERE l.type = 'CHECKIN' AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`
  );
  return row?.c ?? 0;
}

export function hasRedeemed(): boolean {
  return !!db.getFirstSync(
    `SELECT 1 FROM ledger l WHERE l.type = 'REDEEM' AND NOT EXISTS (SELECT 1 FROM ledger r WHERE r.reverses_id = l.id)`
  );
}
