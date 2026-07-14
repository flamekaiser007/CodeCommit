import { Router } from "express";
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchGithubUser,
} from "../lib/github.js";
import { signState, verifyState, signSession } from "../lib/jwt.js";
import { upsertUser } from "../db/index.js";

const router = Router();

const BACKEND_URL = process.env.BACKEND_URL;
const CALLBACK_URL = `${BACKEND_URL}/auth/github/callback`;

/*
 * Accept any Chrome Extension redirect URI.
 *
 * Examples:
 * https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/
 * https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org
 * https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/provider_cb
 */
const ALLOWED_REDIRECT_PATTERN =
  /^https:\/\/[a-p]{32}\.chromiumapp\.org(\/.*)?$/;

// ======================================================
// LOGIN
// ======================================================

router.get("/github/login", (req, res) => {
  const redirectUri = req.query.redirect_uri;

  console.log("\n========== GitHub Login ==========");
  console.log("Received redirect_uri:");
  console.log(redirectUri);
router.get("/github/login", (req, res) => {
  console.log("Query:", req.query);
  console.log("redirect_uri:", req.query.redirect_uri);

  // existing code...
});
  if (!redirectUri) {
    console.error("No redirect_uri received.");
    return res.status(400).send("Missing redirect_uri.");
  }

  if (!ALLOWED_REDIRECT_PATTERN.test(redirectUri)) {
    console.error("redirect_uri rejected.");
    console.error("Pattern:", ALLOWED_REDIRECT_PATTERN);
    return res.status(400).send("Invalid redirect_uri.");
  }

  const state = signState({
    redirectUri,
  });

  const authorizeUrl = buildAuthorizeUrl({
    redirectUri: CALLBACK_URL,
    state,
  });

  console.log("Redirecting to GitHub...");
  console.log(authorizeUrl);
  console.log("===============================\n");

  res.redirect(authorizeUrl);
});

// ======================================================
// CALLBACK
// ======================================================

router.get("/github/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    console.error(error);
    return res.status(400).send(error);
  }

  let redirectUri;

  try {
    ({ redirectUri } = verifyState(state));
  } catch (err) {
    console.error(err);
    return res.status(400).send("State expired.");
  }

  try {
    const accessToken = await exchangeCodeForToken({
      code,
      redirectUri: CALLBACK_URL,
    });

    const githubUser = await fetchGithubUser(accessToken);

    const user = upsertUser({
      githubId: githubUser.id,
      username: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      accessToken,
    });

    const sessionToken = signSession({
      userId: user.id,
    });

    const finalUrl = new URL(redirectUri);

    finalUrl.searchParams.set("token", sessionToken);
    finalUrl.searchParams.set("username", user.username);

    console.log("Login completed.");
    console.log(finalUrl.toString());

    res.redirect(finalUrl.toString());

  } catch (err) {
    console.error(err);
    res.status(500).send("OAuth failed.");
  }
});

export default router;