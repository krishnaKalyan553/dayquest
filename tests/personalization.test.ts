import { ruleBasedProvider as p } from '../src/ai/RuleBasedProvider';
import { initializeDatabase } from '../src/database/database';
import { saveHabit } from '../src/database/habits';
import * as L from '../src/database/ledger';
import { db } from '../src/database/database';
import assert from 'node:assert';

const gym = { personas: ['gym'], about: '', favorites: ['Order pizza'] };
const s = p.suggestRewards(gym);
assert.equal(s[0].name, 'Order pizza');
assert.ok(s[0].favorite);
assert.ok(s.some((r) => r.name === 'Post-workout smoothie' && r.tier === 'small'));
assert.ok(p.message('checkin', gym, { points: 10 }).includes('10'));

// free text implies personas the user never ticked
const text = p.suggestRewards({ personas: [], about: 'I play cricket and love anime', favorites: [] });
assert.ok(text.some((r) => r.name === 'Tickets to a live match'), 'cricket -> sports');
assert.ok(text.some((r) => r.name === 'Cinema trip'), 'anime -> movies');

// nothing chosen -> generic, never empty
assert.ok(p.suggestRewards({ personas: [], about: '', favorites: [] }).length > 0);

// longest streak over non-consecutive runs
initializeDatabase();
const h = saveHabit({ name: 'Read', points: 5, reminder_time: null });
for (const day of ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-05', '2026-01-06']) {
  db.runSync(`INSERT INTO ledger (ts, day, type, habit_id, label, points) VALUES (?, ?, 'CHECKIN', ?, 'Read', 5)`, day, day, h);
}
assert.equal(L.getLongestStreak(h), 3);
assert.equal(L.getCheckInCount(h), 5);
console.log('personalization checks passed');
console.log(s.slice(0, 6).map((r) => `${r.tier}:${r.name}`).join(' | '));
