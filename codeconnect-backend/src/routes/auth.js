import { Router } from "express";
import { buildAuthorizeUrl, exchangeCodeForToken, fetchGithubUser } from "../lib/github.js";
import { signState, verifyState, signSession } from "../lib/jwt.js";
import { upsertUser } from "../db/index.js";

const router = Router();

const BACKEND_URL = process.env.BACKEND_URL;
const CALLBACK_URL = `${BACKEND_URL}/auth/github/callback`;

// Only allow redirecting back to a Chrome extension's own identity
// callback, never to an arbitrary URL — otherwise this becomes an open
// redirect that could be used to steal session tokens.
const ALLOWED_REDIRECT_PATTERN = /^https:\/\/[a-p]{32}\.chromiumapp\.org\/?$/;

// Step 1: the extension calls chrome.identity.launchWebAuthFlow() pointing
// here, passing its own chromiumapp.org redirect URI as a query param.
router.get("/github/login", (req, res) => {
  const { redirect_uri } = req.query;

  if (!redirect_uri || !ALLOWED_REDIRECT_PATTERN.test(redirect_uri)) {
    return res.status(400).send("Missing or invalid redirect_uri.");
  }

  const state = signState({ redirectUri: redirect_uri });
  const authorizeUrl = buildAuthorizeUrl({ redirectUri: CALLBACK_URL, state });

  res.redirect(authorizeUrl);
});

// Step 2: GitHub redirects back here after the user approves access.
router.get("/github/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`GitHub returned an error: ${error}`);
  }

  let redirectUri;
  try {
    ({ redirectUri: redirectUri } = verifyState(state));
  } catch (err) {
    return res.status(400).send("Invalid or expired state — please try logging in again.");
  }

  try {
    const accessToken = await exchangeCodeForToken({ code, redirectUri: CALLBACK_URL });
    const githubUser = await fetchGithubUser(accessToken);

    const user = await upsertUser({
      githubId: githubUser.id,
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      accessToken,
    });

    const sessionToken = signSession({ userId: user.id });

    // Hand off to the extension: append our session token to its
    // chromiumapp.org redirect URI. chrome.identity.launchWebAuthFlow
    // captures this final URL and returns it to the extension's JS.
    const finalUrl = new URL(redirectUri);
    finalUrl.searchParams.set("token", sessionToken);
    finalUrl.searchParams.set("username", user.username);

    res.redirect(finalUrl.toString());
  } catch (err) {
    console.error("[auth] OAuth callback failed:", err);
    res.status(500).send("Something went wrong completing GitHub login. Please try again.");
  }
});

export default router;