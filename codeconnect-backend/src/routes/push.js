import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { pushFile } from "../lib/github.js";
import { buildCommitPlan } from "../lib/format.js";
import { recordSolve } from "../db/index.js";

const router = Router();

// POST /push
// Body: { platform: "leetcode", title: "Two Sum", language: "python3", code: "..." }
// Auth: Authorization: Bearer <session token from OAuth login>
router.post("/", requireAuth, async (req, res) => {
  const { platform, title, language, code } = req.body;

  if (!platform || !title || !code) {
    return res.status(400).json({ error: "platform, title, and code are required." });
  }

  const user = req.user;
  if (!user.repo_owner || !user.repo_name) {
    return res.status(400).json({
      error: "No repository configured yet. Set one via PUT /me/repo first.",
    });
  }

  const { path, message } = buildCommitPlan({ platform, title, language });

  try {
    const result = await pushFile({
      accessToken: user.github_access_token,
      owner: user.repo_owner,
      repo: user.repo_name,
      path,
      content: code,
      message,
    });

    recordSolve(user.id, { platform, title });

    res.json({
      ok: true,
      path,
      url: result.content.html_url,
      commitSha: result.commit.sha,
    });
  } catch (err) {
    console.error("[push] failed:", err);
    res.status(502).json({ ok: false, error: err.message });
  }
});

export default router;
