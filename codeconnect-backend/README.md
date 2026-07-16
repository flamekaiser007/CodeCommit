# CodeConnect Backend

Handles GitHub OAuth for the CodeConnect extension. This is the piece that
lets users click "Login with GitHub" instead of pasting a personal access
token — the `client_secret` required for that flow can only ever live on a
server, never inside the extension itself.

## Setup

```bash
npm install
cp .env.example .env
```

### 1. Create a GitHub OAuth App

Go to https://github.com/settings/developers → "New OAuth App":
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/auth/github/callback`

Copy the generated Client ID and Client Secret into `.env`.

### 2. Generate JWT secrets

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run this twice — once for `STATE_JWT_SECRET`, once for `SESSION_JWT_SECRET` — and paste each into `.env`.

### 3. Run it

```bash
npm run dev
```

Server starts on `http://localhost:3000`. A SQLite file (`codeconnect.db`) is created automatically on first run.

## How the flow works

```
Extension                    Backend                         GitHub
    |                           |                                |
    |--- launchWebAuthFlow ---->|                                |
    |    GET /auth/github/login |                                |
    |                           |--- redirect to authorize ----->|
    |                           |                                |
    |                           |<---- redirect w/ code ---------|
    |                           |    GET /auth/github/callback   |
    |                           |                                |
    |                           |--- exchange code for token --->|
    |                           |<---- access_token --------------|
    |                           |                                |
    |                           |--- fetch GitHub user profile ->|
    |                           |<---- user data -----------------|
    |                           |                                |
    |                     [save/update user in DB]               |
    |                     [issue our own session JWT]             |
    |                           |                                |
    |<-- redirect to chromiumapp.org/?token=... ------------------|
    |    (chrome.identity captures this URL)                     |
    |                           |                                |
    |--- GET /me                |                                |
    |    Authorization: Bearer <token>                            |
    |<-- { username, avatarUrl } --                               |
```

## Endpoints

| Route                       | Purpose                                          |
|------------------------------|---------------------------------------------------|
| `GET /auth/github/login`     | Kicks off the flow. Requires `?redirect_uri=` (the extension's chromiumapp.org URL). |
| `GET /auth/github/callback`  | GitHub redirects here. Exchanges code, creates/updates the user, hands a session token back to the extension. |
| `GET /me`                    | Protected — returns username, avatar, connected repo, and real solve stats: `totalSolves`, `todaySolves`, `currentStreak`, `longestStreak`. |
| `PUT /me/repo`               | Protected — sets which repo pushes go to. Body: `{ owner, repo }`. |
| `POST /push`                 | Protected — the extension calls this on every Accepted submission. Body: `{ platform, title, language, code }`. Pushes to the user's configured repo using their stored GitHub token, and increments their solve count. |
| `GET /health`                | Basic uptime check. |

### Example: pushing a solve (what the extension will call)

```bash
curl -X POST http://localhost:3000/push \
  -H "Authorization: Bearer <sessionToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "leetcode",
    "title": "Two Sum",
    "language": "python3",
    "code": "class Solution:\n    def twoSum(self, nums, target):\n        ..."
  }'
```
Returns `{ ok: true, path, url, commitSha }` on success, or `400` if no repo is configured yet for that user (call `PUT /me/repo` first).

## Extension-side integration

In `background.js`, replace the current "paste a token" flow with:

```js
function loginWithGitHub() {
  const redirectUri = chrome.identity.getRedirectURL(); // https://<ext-id>.chromiumapp.org/
  const authUrl = `http://localhost:3000/auth/github/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

  chrome.identity.launchWebAuthFlow(
    { url: authUrl, interactive: true },
    (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        console.error("GitHub login failed:", chrome.runtime.lastError);
        return;
      }
      const url = new URL(responseUrl);
      const token = url.searchParams.get("token");
      const username = url.searchParams.get("username");
      chrome.storage.local.set({ sessionToken: token, githubUsername: username });
    }
  );
}
```

Note: `chrome.identity.getRedirectURL()` only returns a real `chromiumapp.org` URL when the extension is loaded with a stable ID (either published, or given a fixed `key` in `manifest.json` during development) — a freshly "Load unpacked" extension gets a random ID each reinstall, which will change the redirect URL. For local testing, add a `"key"` field to `manifest.json` (generate one, or just note the ID Chrome assigns and keep reloading the same unpacked folder without removing it).

## Not implemented yet (next steps)

- The GitHub access token is stored **in plaintext** in SQLite — fine for local dev, not for production. Before deploying, encrypt it at rest.
- No rate limiting on `/auth/github/login` or `/push` (the latter especially matters — nothing currently stops a compromised token from being used to spam commits).
- SQLite is fine for one instance; swap for Postgres if you ever run multiple backend instances.
- The extension's `background.js` still pushes directly to GitHub with a pasted PAT — it hasn't been updated to call this backend's `/push` endpoint yet. That's the next wiring step.
- Streak calculation uses UTC calendar days, not the user's local timezone. Someone solving late at night or early morning near the UTC day boundary may see their streak count a solve on a different day than it felt like locally. Documented in detail in `src/lib/streak.js` — the real fix is accepting a per-user timezone offset and shifting the day-boundary math by it.
