import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { setUserRepo } from "../db/index.js";

const router = Router();

// PUT /me/repo  { owner: "flamekaiser007", repo: "LeetCode" }
router.put("/repo", requireAuth, async (req, res) => {
  let { owner, repo } = req.body;
  if (!owner || !repo) {
    return res.status(400).json({ error: "Both owner and repo are required." });
  }
  // Defensive cleanup: a leading "@" (people often type their GitHub handle
  // exactly as displayed elsewhere in the UI, "@username") silently breaks
  // every GitHub API call built from it, turning into a confusing 404
  // instead of an obvious error. Strip it here so it can never happen.
  owner = owner.trim().replace(/^@/, "");
  repo = repo.trim();
  const user = await setUserRepo(req.user.id, { owner, repo });
  res.json({ repoOwner: user.repo_owner, repoName: user.repo_name });
});

export default router;