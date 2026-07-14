// background.js — talks to the CodeConnect backend, never to GitHub
// directly. The backend holds the real GitHub token; this extension only
// ever holds a short-lived session token for OUR backend.

// TODO: change this to your deployed backend URL before publishing.
// Also update manifest.json's host_permissions to match.
const BACKEND_URL = "http://localhost:3000";

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------

function loginWithGitHub() {
  return new Promise((resolve, reject) => {
    const redirectUri = chrome.identity.getRedirectURL(); // https://<ext-id>.chromiumapp.org/
    const authUrl = `${BACKEND_URL}/auth/github/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

    chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (responseUrl) => {
      if (chrome.runtime.lastError || !responseUrl) {
        reject(new Error(chrome.runtime.lastError?.message || "Login was cancelled or failed."));
        return;
      }
      const url = new URL(responseUrl);
      const token = url.searchParams.get("token");
      const username = url.searchParams.get("username");

      if (!token) {
        reject(new Error("Backend did not return a session token."));
        return;
      }

      chrome.storage.local.set({ sessionToken: token, githubUsername: username }, () => {
        resolve({ token, username });
      });
    });
  });
}

async function logout() {
  await chrome.storage.local.remove(["sessionToken", "githubUsername"]);
}

async function getSessionToken() {
  const { sessionToken } = await chrome.storage.local.get(["sessionToken"]);
  return sessionToken || null;
}

// Fetches the logged-in user's profile + connected repo + solve count.
// Used by the popup to render its current state.
async function fetchMe() {
  const token = await getSessionToken();
  if (!token) return null;

  const res = await fetch(`${BACKEND_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    if (res.status === 401) await logout(); // stale/expired session
    return null;
  }
  return res.json();
}

async function setRepo({ owner, repo }) {
  const token = await getSessionToken();
  if (!token) throw new Error("Not logged in.");

  const res = await fetch(`${BACKEND_URL}/me/repo`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ owner, repo }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to save repo.");
  return data;
}

// ---------------------------------------------------------------------
// Push
// ---------------------------------------------------------------------

// Every content script sends the same shape of message, regardless of platform:
// { type: "SUBMISSION_SUCCESS", platform, title, language, code }
async function handleSubmission({ platform, title, language, code }) {
  const token = await getSessionToken();
  if (!token) {
    throw new Error("Not logged in — open the extension popup and connect GitHub first.");
  }

  const res = await fetch(`${BACKEND_URL}/push`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ platform, title, language, code }),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(result.error || `Push failed with status ${res.status}`);
  }
  return result; // { ok, path, url, commitSha }
}

// ---------------------------------------------------------------------
// Message routing — content scripts and the popup both talk to us here
// ---------------------------------------------------------------------

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg?.type) {
    case "SUBMISSION_SUCCESS":
      handleSubmission(msg)
        .then((result) => {
          sendResponse({ ok: true, ...result });
          chrome.notifications?.create?.({
            type: "basic",
            iconUrl: "icons/icon-128.png",
            title: "Pushed to GitHub",
            message: `${msg.title} -> ${result.path}`,
          });
        })
        .catch((err) => {
          console.error("[CodeConnect] push failed:", err);
          sendResponse({ ok: false, error: err.message });
        });
      return true; // async response

    case "LOGIN":
      loginWithGitHub()
        .then((data) => sendResponse({ ok: true, ...data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "LOGOUT":
      logout().then(() => sendResponse({ ok: true }));
      return true;

    case "GET_ME":
      fetchMe()
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case "SET_REPO":
      setRepo(msg.payload)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    default:
      return false; // not for us
  }
});