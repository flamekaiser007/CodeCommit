// Runs in the isolated content-script world, which is the only place
// with access to chrome.runtime. It just relays messages posted by
// leetcode-inject.js (which runs in the page's own world).

window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  if (event.data?.source !== "code2git") return;
  if (event.data?.type !== "SUBMISSION_SUCCESS") return;

  chrome.runtime.sendMessage(event.data, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[Code2Git] message failed:", chrome.runtime.lastError.message);
      return;
    }
    if (response?.ok) {
      console.log(`[Code2Git] pushed to ${response.path}`);
    } else {
      console.error("[Code2Git] push failed:", response?.error);
    }
  });
});