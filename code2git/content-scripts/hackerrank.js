// HackerRank STUB — needs live testing, don't trust the selectors below blindly.
//
// HackerRank's challenge pages are heavily JS-driven (React), and the
// submit flow goes through an internal REST API rather than a full page
// reload, similar in spirit to LeetCode. The exact endpoint names change
// between challenge types (algorithms vs. SQL vs. general prep), so this
// needs to be confirmed per challenge type in devtools > Network while
// submitting:
//
//   1. Open a HackerRank challenge, open devtools > Network, filter by XHR.
//   2. Click "Submit Code".
//   3. Look for a POST request (often to something under /rest/contests/.../submissions)
//      that kicks off judging, and a follow-up GET/poll request that
//      returns a status field once judging finishes (commonly "Accepted"
//      or a numeric status code — check the actual response shape).
//   4. The submitted source is usually in the POST request body (a `code`
//      or `sourcecode` field, base64 or plain — check).
//
// Suggested implementation plan (mirrors leetcode-inject.js):
//   - Patch window.fetch (or XMLHttpRequest, HackerRank has used both
//     historically) in a MAIN-world script to catch the submit request
//     and the poll-for-verdict request.
//   - Once verdict is confirmed accepted, postMessage to an isolated-world
//     bridge script, which forwards to background.js exactly like LeetCode.
//
// Once you have { title, language, code }, send it the same way LeetCode does:
//
//   chrome.runtime.sendMessage({
//     type: "SUBMISSION_SUCCESS",
//     platform: "hackerrank",
//     title, language, code,
//   });

console.log("[Code2Git] HackerRank content script loaded — detection not yet implemented.");

// TODO: implement fetch/XHR interception here, following the pattern
// in content-scripts/leetcode-inject.js once you've confirmed the
// actual request/response shapes in devtools.