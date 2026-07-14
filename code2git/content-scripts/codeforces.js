// Codeforces — verdict detection via the OFFICIAL public API (documented,
// rate-limited, no key needed for reads): https://codeforces.com/apiHelp
//
// This is more reliable than the fetch-interception approach used for
// LeetCode, because Codeforces' API is a stable, versioned contract rather
// than an undocumented internal endpoint that can change without notice
// (which is exactly what broke LeetCode detection earlier -- an undocumented
// /v2/ path segment got added with zero warning).
//
// CONFIRMED (via Codeforces' own docs + several independent sources):
//   GET https://codeforces.com/api/user.status?handle={handle}&count=5
//   -> { status: "OK", result: [ { id, problem: {name, index, contestId},
//                                  verdict, programmingLanguage,
//                                  creationTimeSeconds, ... }, ... ] }
//   verdict === "OK" means Accepted. Anything else (WRONG_ANSWER,
//   TIME_LIMIT_EXCEEDED, etc.) is not.
//
// NOT PROVIDED by the API, confirmed by multiple sources: source code.
// So getting the actual submitted code still requires scraping the
// submission's own page -- this part is UNVERIFIED, same caveat as the
// original stub. If pushes stop working, this selector is the first
// place to check (open a submission page, inspect the source block).
//
//   GET https://codeforces.com/contest/{contestId}/submission/{id}
//   -> assumed: <pre id="program-source-text">...code...</pre>

const POLL_INTERVAL_MS = 12000; // stay safely under CF's 1-req/2s limit
const SEEN_IDS_KEY = "cfSeenSubmissionIds";
const HANDLE_KEY = "codeforcesHandle";
const MAX_SEEN_IDS = 200; // cap storage growth

async function getStoredHandle() {
  const { [HANDLE_KEY]: handle } = await chrome.storage.local.get([HANDLE_KEY]);
  return handle || null;
}

async function getSeenIds() {
  const { [SEEN_IDS_KEY]: ids } = await chrome.storage.local.get([SEEN_IDS_KEY]);
  return new Set(ids || []);
}

async function markSeen(id, seenSet) {
  seenSet.add(id);
  const trimmed = Array.from(seenSet).slice(-MAX_SEEN_IDS);
  await chrome.storage.local.set({ [SEEN_IDS_KEY]: trimmed });
}

// UNVERIFIED: this selector is a best guess from public examples of
// Codeforces' submission page, not confirmed against the live site.
function extractSourceFromHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const el = doc.querySelector("#program-source-text");
  return el ? el.textContent : null;
}

async function fetchSourceCode(contestId, submissionId) {
  const url = `https://codeforces.com/contest/${contestId}/submission/${submissionId}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to load submission page: ${res.status}`);
  const html = await res.text();
  console.log("[CF-DEBUG] fetch status:", res.status, "html length:", html.length);
  console.log("[CF-DEBUG] contains #include:", html.includes("#include"));
  console.log("[CF-DEBUG] contains program-source-text:", html.includes("program-source-text"));
  console.log("[CF-DEBUG] first 300 chars:", html.slice(0, 300));
  const code = extractSourceFromHtml(html);
  if (!code) throw new Error("Could not find source code on submission page -- selector may be outdated.");
  return code;
}

async function pollOnce() {
  const handle = await getStoredHandle();
  if (!handle) return; // not configured yet, nothing to do

  let data;
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&count=5`
    );
    data = await res.json();
  } catch (e) {
    console.warn("[CodeConnect] Codeforces API poll failed", e);
    return;
  }

  if (data.status !== "OK" || !Array.isArray(data.result)) return;

  const seen = await getSeenIds();
  // Process oldest-first among the new ones, so ordering is preserved
  // if somehow more than one new Accepted verdict shows up between polls.
  const newAccepted = data.result
    .filter((sub) => sub.verdict === "OK" && !seen.has(sub.id))
    .reverse();

  for (const sub of newAccepted) {
    await markSeen(sub.id, seen); // mark immediately so a slow/failed push can't retry-loop forever

    try {
      const code = await fetchSourceCode(sub.problem.contestId, sub.id);
      const title = `${sub.problem.index}. ${sub.problem.name}`;

      chrome.runtime.sendMessage({
        type: "SUBMISSION_SUCCESS",
        platform: "codeforces",
        title,
        language: sub.programmingLanguage,
        code,
      });
    } catch (e) {
      console.error("[CodeConnect] Codeforces: found new Accepted submission but couldn't fetch source", e);
    }
  }
}

getStoredHandle().then((handle) => {
  if (!handle) {
    console.log(
      "[CodeConnect] No Codeforces handle configured yet -- set one in the extension popup to enable syncing."
    );
    return;
  }
  console.log(`[CodeConnect] Codeforces polling active for handle "${handle}"`);
  pollOnce(); // check immediately on page load
  setInterval(pollOnce, POLL_INTERVAL_MS);
});