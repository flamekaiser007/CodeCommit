import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { todayUTC, computeCurrentStreak, computeLongestStreak } from "../lib/streak.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "..", "codeconnect.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id INTEGER UNIQUE NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    -- NOTE: stored in plaintext for this MVP. Before going to production,
    -- encrypt this at rest (e.g. with a KMS-managed key) since it's a
    -- live credential that can push to any repo the user granted access to.
    github_access_token TEXT NOT NULL,
    repo_owner TEXT,
    repo_name TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- One row per successful push. total/today/streak are all DERIVED from
  -- this table rather than kept as separate running counters, so there's
  -- no risk of a counter drifting out of sync with reality.
  CREATE TABLE IF NOT EXISTS solves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL,
    title TEXT NOT NULL,
    solved_date TEXT NOT NULL, -- YYYY-MM-DD, UTC calendar day
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_solves_user_date ON solves(user_id, solved_date);
`);

export function setUserRepo(userId, { owner, repo }) {
  db.prepare("UPDATE users SET repo_owner = ?, repo_name = ? WHERE id = ?").run(
    owner,
    repo,
    userId
  );
  return getUserById(userId);
}

export function recordSolve(userId, { platform, title }) {
  db.prepare(
    "INSERT INTO solves (user_id, platform, title, solved_date) VALUES (?, ?, ?, ?)"
  ).run(userId, platform, title, todayUTC());
}

export function getStats(userId) {
  const totalSolves = db
    .prepare("SELECT COUNT(*) AS n FROM solves WHERE user_id = ?")
    .get(userId).n;

  const todaySolves = db
    .prepare("SELECT COUNT(*) AS n FROM solves WHERE user_id = ? AND solved_date = ?")
    .get(userId, todayUTC()).n;

  const rows = db
    .prepare(
      "SELECT DISTINCT solved_date FROM solves WHERE user_id = ? ORDER BY solved_date DESC"
    )
    .all(userId);
  const datesDesc = rows.map((r) => r.solved_date);
  const datesAsc = [...datesDesc].reverse();

  return {
    totalSolves,
    todaySolves,
    currentStreak: computeCurrentStreak(datesDesc),
    longestStreak: computeLongestStreak(datesAsc),
  };
}

export function upsertUser({ githubId, username, avatarUrl, accessToken }) {
  const existing = db
    .prepare("SELECT * FROM users WHERE github_id = ?")
    .get(githubId);

  if (existing) {
    db.prepare(
      "UPDATE users SET username = ?, avatar_url = ?, github_access_token = ? WHERE github_id = ?"
    ).run(username, avatarUrl, accessToken, githubId);
    return db.prepare("SELECT * FROM users WHERE github_id = ?").get(githubId);
  }

  const result = db
    .prepare(
      "INSERT INTO users (github_id, username, avatar_url, github_access_token) VALUES (?, ?, ?, ?)"
    )
    .run(githubId, username, avatarUrl, accessToken);

  return db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
}

export function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}

export default db;
