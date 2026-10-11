import * as SQLite from 'expo-sqlite';

export const db = SQLite.openDatabaseSync('habit_rewards.db');

export function initializeDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      points INTEGER NOT NULL,
      reminder_time TEXT,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost INTEGER NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Append-only: the app never UPDATEs or DELETEs rows here.
    CREATE TABLE IF NOT EXISTS ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      day TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('CHECKIN', 'REDEEM', 'REVERSAL')),
      habit_id INTEGER,
      reward_id INTEGER,
      label TEXT NOT NULL,
      points INTEGER NOT NULL,
      reverses_id INTEGER UNIQUE,
      FOREIGN KEY (habit_id) REFERENCES habits(id),
      FOREIGN KEY (reward_id) REFERENCES rewards(id),
      FOREIGN KEY (reverses_id) REFERENCES ledger(id)
    );
    CREATE INDEX IF NOT EXISTS idx_ledger_day ON ledger(day);
    CREATE INDEX IF NOT EXISTS idx_ledger_habit_day ON ledger(habit_id, day);

    CREATE TABLE IF NOT EXISTS profile (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
