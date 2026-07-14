const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

export function buildAuthorizeUrl({ redirectUri, state }) {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "repo read:user",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken({ code, redirectUri }) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  if (data.error) {
    throw new Error(`GitHub token exchange failed: ${data.error_description || data.error}`);
  }
  return data.access_token;
}

export async function fetchGithubUser(accessToken) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch GitHub user: ${res.status}`);
  }
  return res.json();
}

// Creates or updates a single file in a repo — this call IS the commit.
// accessToken here is the user's own GitHub token (from OAuth), not a
// server-wide credential, so it only ever has whatever access the user
// personally granted when they authorized the app.
export async function pushFile({ accessToken, owner, repo, path, content, message }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

  let sha;
  const existing = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });
  if (existing.status === 200) {
    sha = (await existing.json()).sha;
  } else if (existing.status !== 404) {
    const err = await existing.json().catch(() => ({}));
    throw new Error(`Failed to check existing file: ${existing.status} ${err.message || ""}`);
  }

  const body = {
    message,
    content: Buffer.from(content, "utf-8").toString("base64"),
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await res.json();
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status}: ${result.message || "unknown error"}`);
  }
  return result;
}
