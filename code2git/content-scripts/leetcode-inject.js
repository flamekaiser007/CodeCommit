// Runs in the PAGE's own JS context (world: "MAIN"), which is required
// because we need to intercept LeetCode's *own* fetch calls, not just
// ones made by our content script.
//
// LeetCode's flow (confirmed live, July 2026):
//   1. POST /problems/{slug}/submit/                -> { submission_id }
//      request body contains { lang, question_id, typed_code }
//   2. GET  /submissions/detail/{id}/v2/check/       -> polled every ~1s
//      (note the /v2/ segment -- earlier versions of this script assumed
//      /submissions/detail/{id}/check/ with no /v2/, which silently never
//      matched and was the root cause of pushes never firing)
//      response contains { state: "PENDING" | "STARTED" | "SUCCESS", status_msg, ... }
//      state "SUCCESS" + status_msg "Accepted" means it passed.
//
// This endpoint isn't officially documented by LeetCode and has changed
// before (this /v2/ addition is proof) -- if this stops firing again, open
// devtools > Network while submitting and diff the request/response shape
// against what's below.

(function () {
  const originalFetch = window.fetch;
  let pendingSubmission = null; // { language, code }

  window.fetch = async function (...args) {
    const [resource, options] = args;
    const url =
      typeof resource === "string"
        ? resource
        : resource instanceof Request
        ? resource.url
        : "";

    // Step 1: catch the submit request to grab the code + language.
    if (options?.method === "POST" && /\/problems\/[^/]+\/submit\/?$/.test(url)) {
      try {
        const body = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
        pendingSubmission = {
          language: body.lang,
          code: body.typed_code,
        };
      } catch (e) {
        console.warn("[CodeConnect] couldn't parse submit body", e);
      }
    }

    const response = await originalFetch.apply(this, args);

    // Step 2: catch the verdict poll and check for acceptance.
    // Matches both with and without /v2/ for resilience against LeetCode
    // rolling this back or forward again.
    if (/\/submissions\/detail\/\d+\/(v2\/)?check\/?$/.test(url) && pendingSubmission) {
      response
        .clone()
        .json()
        .then((data) => {
          const accepted =
            data.status_msg === "Accepted" || data.state === "SUCCESS";

          if (!accepted) return;

          const title =
            document.querySelector("[data-cy='question-title']")?.textContent ||
            document.title.replace(" - LeetCode", "") ||
            "Unknown Problem";

          window.postMessage(
            {
              source: "code2git",
              type: "SUBMISSION_SUCCESS",
              platform: "leetcode",
              title: title.trim(),
              language: pendingSubmission.language,
              code: pendingSubmission.code,
            },
            "*"
          );
          pendingSubmission = null; // don't fire twice for the same submission
        })
        .catch(() => {}); // ignore parse errors on unrelated responses
    }

    return response;
  };
})();
