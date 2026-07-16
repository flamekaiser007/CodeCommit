import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { todayUTC, computeCurrentStreak, computeLongestStreak } from "../lib/streak.js";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      github_id BIGINT UNIQUE NOT NULL,
      username TEXT NOT NULL,
      avatar_url TEXT,
      github_access_token TEXT NOT NULL,
      repo_owner TEXT,
      repo_name TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS solves (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      platform TEXT NOT NULL,
      title TEXT NOT NULL,
      solved_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_solves_user_date ON solves(user_id, solved_date);
  `);
}

const ready = init();

export async function setUserRepo(userId, { owner, repo }) {
  await ready;
  await pool.query("UPDATE users SET repo_owner = $1, repo_name = $2 WHERE id = $3", [owner, repo, userId]);
  return getUserById(userId);
}

export async function recordSolve(userId, { platform, title }) {
  await ready;
  await pool.query(
    "INSERT INTO solves (user_id, platform, title, solved_date) VALUES ($1, $2, $3, $4)",
    [userId, platform, title, todayUTC()]
  );
}

export async function getStats(userId) {
  await ready;
  const totalRes = await pool.query("SELECT COUNT(*) AS n FROM solves WHERE user_id = $1", [userId]);
  const totalSolves = Number(totalRes.rows[0].n);
  const todayRes = await pool.query(
    "SELECT COUNT(*) AS n FROM solves WHERE user_id = $1 AND solved_date = $2",
    [userId, todayUTC()]
  );
  const todaySolves = Number(todayRes.rows[0].n);
  const datesRes = await pool.query(
    "SELECT DISTINCT solved_date FROM solves WHERE user_id = $1 ORDER BY solved_date DESC",
    [userId]
  );
  const datesDesc = datesRes.rows.map((r) => {
    const d = r.solved_date;
    return d instanceof Date ? d.toISOString().slice(0, 10) : d;
  });
  const datesAsc = [...datesDesc].reverse();
  return {
    totalSolves,
    todaySolves,
    currentStreak: computeCurrentStreak(datesDesc),
    longestStreak: computeLongestStreak(datesAsc),
  };
}

export async function upsertUser({ githubId, username, avatarUrl, accessToken }) {
  await ready;
  const existing = await pool.query("SELECT * FROM users WHERE github_id = $1", [githubId]);
  if (existing.rows.length > 0) {
    const updated = await pool.query(
      "UPDATE users SET username = $1, avatar_url = $2, github_access_token = $3 WHERE github_id = $4 RETURNING *",
      [username, avatarUrl, accessToken, githubId]
    );
    return updated.rows[0];
  }
  const inserted = await pool.query(
    "INSERT INTO users (github_id, username, avatar_url, github_access_token) VALUES ($1, $2, $3, $4) RETURNING *",
    [githubId, username, avatarUrl, accessToken]
  );
  return inserted.rows[0];
}

export async function getUserById(id) {
  await ready;
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] || null;
}

export default pool;
