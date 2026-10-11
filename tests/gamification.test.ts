import assert from 'node:assert';
import { initializeDatabase, db } from '../src/database/database';
import { saveHabit } from '../src/database/habits';
import * as L from '../src/database/ledger';
import { levelInfo, motivation, nextMilestone, syncAchievements } from '../src/gamification';
import { loadData } from '../src/dashboard';

// levels: XP is total earned; thresholds 20, 80, 180...
assert.equal(levelInfo(0).level, 1);
assert.equal(levelInfo(19).level, 1);
assert.equal(levelInfo(20).level, 2);
assert.equal(levelInfo(80).level, 3);
assert.equal(levelInfo(10).progress, 0.5);
assert.equal(nextMilestone(0), 3);
assert.equal(nextMilestone(7), 14);
assert.equal(nextMilestone(100), null);

assert.match(motivation({ habitCount: 0, doneToday: 0, activityStreak: 0 }), /Add your first habit/);
assert.match(motivation({ habitCount: 2, doneToday: 0, activityStreak: 5 }), /5-day streak is on the line/);
assert.match(motivation({ habitCount: 2, doneToday: 2, activityStreak: 5 }), /Perfect day/);
assert.match(motivation({ habitCount: 3, doneToday: 1, activityStreak: 1 }), /2 to go/);

initializeDatabase();
const a = saveHabit({ name: 'Read', points: 10, reminder_time: null });
const b = saveHabit({ name: 'Run', points: 10, reminder_time: null });

// 3 past consecutive days + today
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() - offset); return L.dayString(d); };
for (const off of [3, 2, 1]) {
  db.runSync(`INSERT INTO ledger (ts, day, type, habit_id, label, points) VALUES (?, ?, 'CHECKIN', ?, 'Read', 10)`, day(off), day(off), a);
}
assert.equal(L.getActivityStreak(), 3, 'streak counts through yesterday when today is not done');
let d = loadData();
assert.equal(d.activityStreak, 3);
assert.ok(d.achievements.find((x) => x.id === 'streak3')!.unlocked);
assert.ok(d.newAchievements.some((x) => x.id === 'streak3'));
assert.equal(loadData().newAchievements.length, 0, 'achievements only announced once');

assert.equal(L.checkIn(a).ok, true);
assert.equal(L.getActivityStreak(), 4);
assert.equal(loadData().habits.find((h) => h.id === a)!.streak, 4);
assert.equal(L.checkIn(b).ok, true);
d = loadData();
assert.equal(d.doneToday, 2);
assert.ok(d.achievements.find((x) => x.id === 'full_house')!.unlocked, 'perfect day unlocked');

// badge survives undo and adding more habits
L.undo(L.activeCheckInToday(b)!);
saveHabit({ name: 'Extra', points: 5, reminder_time: null });
assert.ok(loadData().achievements.find((x) => x.id === 'full_house')!.unlocked, 'badges never disappear');

// undoing today's only check-in drops the streak back to the carried-over value
L.undo(L.activeCheckInToday(a)!);
assert.equal(L.getActivityStreak(), 3);
assert.equal(L.getBestActivityStreak(), 3);
console.log('gamification checks passed; level', loadData().level.level, loadData().level.title);
