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
| `GET /me`                    | Protected — returns the logged-in user's GitHub username/avatar. Used to confirm a session token is valid. |
| `GET /health`                | Basic uptime check. |

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
- No rate limiting on `/auth/github/login`.
- SQLite is fine for one instance; swap for Postgres if you ever run multiple backend instances.
- No endpoint yet for the actual "push accepted solution" step — that's the next piece, and it'll live behind `requireAuth` just like `/me`.
