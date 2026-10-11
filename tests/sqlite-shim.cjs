const Module = require('module');
const { DatabaseSync } = require('node:sqlite');
const raw = new DatabaseSync(':memory:');
const norm = (a) => a.flat();
const fake = { openDatabaseSync: () => ({
  execSync: (s) => raw.exec(s),
  runSync: (s, ...a) => { const r = raw.prepare(s).run(...norm(a)); return { lastInsertRowId: Number(r.lastInsertRowid), changes: r.changes }; },
  getFirstSync: (s, ...a) => raw.prepare(s).get(...norm(a)) ?? null,
  getAllSync: (s, ...a) => raw.prepare(s).all(...norm(a)),
  withTransactionSync: (f) => { raw.exec('BEGIN'); try { f(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; } },
}) };
const orig = Module._load;
Module._load = function (req, ...r) { return req === 'expo-sqlite' ? fake : orig.call(this, req, ...r); };
