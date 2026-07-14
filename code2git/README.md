# CodeConnect Extension

Pushes your accepted coding-challenge submissions straight to a GitHub repo — via the CodeConnect backend, using real GitHub OAuth (no pasted tokens).

## Status

| Platform    | Detection            | Status |
|-------------|-----------------------|--------|
| LeetCode    | fetch interception    | Implemented — should work close to out of the box |
| Codeforces  | DOM (planned)          | Stub only — see TODOs in `content-scripts/codeforces.js` |
| HackerRank  | fetch/XHR (planned)    | Stub only — see TODOs in `content-scripts/hackerrank.js` |

**This version requires the `codeconnect-backend` project running.** The extension no longer talks to GitHub directly — it authenticates and pushes through the backend, which holds the real GitHub access token.

## Project structure

```
code2git/
├── manifest.json                        # Manifest V3 config — now includes "identity" permission
├── background.js                        # Login (chrome.identity), and calls to the backend's /push, /me, /me/repo
├── popup.html / popup.js                # "Login with GitHub" + repo config UI
└── content-scripts/
    ├── leetcode-inject.js               # Runs in page context, patches fetch — UNCHANGED
    ├── leetcode-bridge.js               # Relays page messages to background.js — UNCHANGED
    ├── codeforces.js                    # STUB — needs implementation
    └── hackerrank.js                    # STUB — needs implementation
```

Content scripts are untouched by this change — they still just send `{ type: "SUBMISSION_SUCCESS", platform, title, language, code }` to `background.js`. Only what happens *after* that message changed.

## Before loading this

1. Get `codeconnect-backend` running first (see its own README) — this extension is useless without it.
2. `background.js` has `const BACKEND_URL = "http://localhost:3000"` at the top — update this (and `manifest.json`'s `host_permissions`) if your backend runs somewhere else.

## How to load it in Chrome

1. Go to `chrome://extensions`
2. Turn on "Developer mode"
3. Click "Load unpacked" → select this `code2git` folder
4. Click the extension icon → "Login with GitHub" → approve on GitHub's screen
5. Back in the popup, enter the repo you want pushes to go to → "Save Repository"

## A gotcha with chrome.identity during local development

`chrome.identity.getRedirectURL()` builds its callback URL from your extension's ID — but a freshly "Load unpacked" extension gets a **new random ID every time you remove and re-add it**. If login stops working after reloading the extension fresh, that's why: the redirect URL changed, but GitHub / the backend don't know about the new one.

Workaround for stable local testing: don't remove the extension between reloads (just click the reload icon on the extensions page instead), or pin the extension ID with a fixed `"key"` field in `manifest.json` (see `codeconnect-backend`'s README for more on this).

## Testing the full flow

1. Open any LeetCode problem, submit a solution that gets Accepted
2. Check the extension's service worker console (`chrome://extensions` → "service worker" link under CodeConnect) for `[CodeConnect] pushed to ...` — or a push failure with the reason
3. Check your GitHub repo — you should see a new folder `leetcode/{problem-slug}/solution.{ext}`

## Filling in Codeforces / HackerRank

Both files have a plan written out in comments. The short version for either:

1. Open devtools → Network → filter to XHR/fetch
2. Submit a solution and watch what requests fire
3. Find the one that reveals verdict + language + source code
4. Intercept it (fetch patch for HackerRank, MutationObserver for Codeforces is simplest since it doesn't expose a clean API)
5. Send the same message shape as LeetCode does — `background.js` needs no changes for a new platform, since the whole point of routing through `SUBMISSION_SUCCESS` is that platform-specific detection is fully decoupled from the push logic.

## Notes

- No token of any kind is stored in the extension anymore — only a short-lived session JWT for *your own backend*, in `chrome.storage.local`.
- Files are organized as `{platform}/{problem-slug}/solution.{ext}` — this logic now lives in the backend (`src/lib/format.js`), not here.

# codecommit
