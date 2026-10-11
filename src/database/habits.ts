import { db } from './database';

export type Habit = {
  id: number;
  name: string;
  points: number;
  reminder_time: string | null; // 'HH:MM' 24h
  archived: number;
};

export type Reward = {
  id: number;
  name: string;
  cost: number;
  archived: number;
};

export function getHabits(): Habit[] {
  return db.getAllSync<Habit>('SELECT * FROM habits WHERE archived = 0 ORDER BY id');
}

export function getHabit(id: number): Habit | null {
  return db.getFirstSync<Habit>('SELECT * FROM habits WHERE id = ?', id) ?? null;
}

export function saveHabit(h: { id?: number; name: string; points: number; reminder_time: string | null }): number {
  if (h.id) {
    db.runSync('UPDATE habits SET name = ?, points = ?, reminder_time = ? WHERE id = ?', h.name, h.points, h.reminder_time, h.id);
    return h.id;
  }
  const res = db.runSync(
    'INSERT INTO habits (name, points, reminder_time, created_at) VALUES (?, ?, ?, ?)',
    h.name,
    h.points,
    h.reminder_time,
    new Date().toISOString()
  );
  return res.lastInsertRowId;
}

/** Soft delete so ledger history keeps its references. */
export function archiveHabit(id: number) {
  db.runSync('UPDATE habits SET archived = 1 WHERE id = ?', id);
}

export function getRewards(): Reward[] {
  return db.getAllSync<Reward>('SELECT * FROM rewards WHERE archived = 0 ORDER BY cost, id');
}

export function saveReward(r: { id?: number; name: string; cost: number }): number {
  if (r.id) {
    db.runSync('UPDATE rewards SET name = ?, cost = ? WHERE id = ?', r.name, r.cost, r.id);
    return r.id;
  }
  const res = db.runSync(
    'INSERT INTO rewards (name, cost, created_at) VALUES (?, ?, ?)',
    r.name,
    r.cost,
    new Date().toISOString()
  );
  return res.lastInsertRowId;
}

export function archiveReward(id: number) {
  db.runSync('UPDATE rewards SET archived = 1 WHERE id = ?', id);
}

export function getProfileValue(key: string): string | null {
  return db.getFirstSync<{ value: string }>('SELECT value FROM profile WHERE key = ?', key)?.value ?? null;
}

export function setProfileValue(key: string, value: string) {
  db.runSync('INSERT INTO profile (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, value);
}
