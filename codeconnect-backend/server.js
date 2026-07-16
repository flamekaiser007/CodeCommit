import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import meRoutes from "./src/routes/me.js";
import pushRoutes from "./src/routes/push.js";
import { requireAuth } from "./src/middleware/requireAuth.js";
import { getStats } from "./src/db/index.js";

dns.setDefaultResultOrder("ipv4first");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/me", meRoutes);
app.use("/push", pushRoutes);

// Quick sanity-check route: the extension can call this after login to
// confirm the session token works and to display "Connected as X", plus
// real solve/streak stats for the popup's dashboard view.
app.get("/me", requireAuth, async (req, res) => {
  const stats = await getStats(req.user.id);
  res.json({
    username: req.user.username,
    avatarUrl: req.user.avatar_url,
    repoOwner: req.user.repo_owner,
    repoName: req.user.repo_name,
    ...stats, // totalSolves, todaySolves, currentStreak, longestStreak
  });
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[CodeConnect backend] listening on http://localhost:${PORT}`);
});