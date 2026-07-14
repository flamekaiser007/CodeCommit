const loggedOutView = document.getElementById("loggedOutView");
const loggedInView = document.getElementById("loggedInView");
const statusEl = document.getElementById("status");

const ownerInput = document.getElementById("owner");
const repoInput = document.getElementById("repo");
const cfHandleInput = document.getElementById("cfHandle");
const leetcodeHandleInput = document.getElementById("leetcodeHandle");

const repoBtn = document.getElementById("saveRepoBtn");
const cfBtn = document.getElementById("saveCfHandleBtn");
const leetcodeBtn = document.getElementById("saveLeetcodeBtn");

const leetcodeToggle = document.getElementById("leetcodeToggle");
const codeforcesToggle = document.getElementById("codeforcesToggle");
const leetcodePanel = document.getElementById("leetcodePanel");
const codeforcesPanel = document.getElementById("codeforcesPanel");
const leetcodePreview = document.getElementById("leetcodePreview");
const codeforcesPreview = document.getElementById("codeforcesPreview");

function showStatus(text, type = "ok") {
  statusEl.className = type;
  statusEl.textContent = text;

  if (text) {
    setTimeout(() => {
      statusEl.textContent = "";
      statusEl.className = "";
    }, 3000);
  }
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, resolve);
  });
}

function markButtonSaved(button) {
  button.textContent = "✓ Saved";
  button.style.background = "#16a34a";
  button.disabled = true;
}

function resetButton(button, text) {
  button.textContent = text;
  button.style.background = "#111";
  button.disabled = false;
}

/* ---------------- COLLAPSIBLE PROFILE PANELS ---------------- */

function togglePanel(toggleBtn, panel) {
  const isOpen = panel.classList.contains("open");

  if (isOpen) {
    panel.classList.remove("open");
    toggleBtn.classList.remove("open");
  } else {
    panel.classList.add("open");
    toggleBtn.classList.add("open");
  }
}

leetcodeToggle.addEventListener("click", () => {
  togglePanel(leetcodeToggle, leetcodePanel);
});

codeforcesToggle.addEventListener("click", () => {
  togglePanel(codeforcesToggle, codeforcesPanel);
});

async function render() {
  const res = await sendMessage({ type: "GET_ME" });

  if (!res?.ok || !res.data) {
    loggedOutView.style.display = "block";
    loggedInView.style.display = "none";
    return;
  }

  loggedOutView.style.display = "none";
  loggedInView.style.display = "block";

  const {
    username,
    repoOwner,
    repoName,
    totalSolves,
    todaySolves,
    currentStreak
  } = res.data;

  document.getElementById("userPill").textContent = `@${username}`;

  ownerInput.value = repoOwner || "";
  repoInput.value = repoName || "";

  document.getElementById("totalSolves").textContent =
    totalSolves ?? 0;

  document.getElementById("todaySolves").textContent =
    todaySolves ?? 0;

  document.getElementById("currentStreak").textContent =
    `${currentStreak ?? 0} day${currentStreak === 1 ? "" : "s"}`;

  const { codeforcesHandle, leetcodeHandle } =
    await chrome.storage.local.get(["codeforcesHandle", "leetcodeHandle"]);

  cfHandleInput.value = codeforcesHandle || "";
  leetcodeHandleInput.value = leetcodeHandle || "";

  if (repoOwner && repoName) {
    markButtonSaved(repoBtn);
  }

  if (codeforcesHandle) {
    markButtonSaved(cfBtn);
    codeforcesPreview.textContent = `@${codeforcesHandle}`;
  }

  if (leetcodeHandle) {
    markButtonSaved(leetcodeBtn);
    leetcodePreview.textContent = `@${leetcodeHandle}`;
  }
}

/* ---------------- LOGIN ---------------- */

document.getElementById("loginBtn").addEventListener("click", async () => {

  showStatus("Opening GitHub login...");

  const res = await sendMessage({
    type: "LOGIN"
  });

  if (res?.ok) {
    showStatus(`Logged in as @${res.username}`);
    render();
  } else {
    showStatus(res?.error || "Login failed.", "err");
  }
});

/* ---------------- LOGOUT ---------------- */

document.getElementById("logoutBtn").addEventListener("click", async () => {

  await sendMessage({
    type: "LOGOUT"
  });

  resetButton(repoBtn, "Save Repository");
  resetButton(cfBtn, "Save Handle");
  resetButton(leetcodeBtn, "Save Handle");

  codeforcesPreview.textContent = "";
  leetcodePreview.textContent = "";

  render();
});

/* ---------------- SAVE REPOSITORY ---------------- */

repoBtn.addEventListener("click", async () => {

  const owner = ownerInput.value.trim();
  const repo = repoInput.value.trim();

  if (!owner || !repo) {
    showStatus("Both owner and repository name are required.", "err");
    return;
  }

  const res = await sendMessage({
    type: "SET_REPO",
    payload: {
      owner,
      repo
    }
  });

  if (res?.ok) {
    markButtonSaved(repoBtn);
    showStatus("Repository saved.");
  } else {
    showStatus(res?.error || "Failed to save repository.", "err");
  }
});

/* ---------------- SAVE CODEFORCES HANDLE ---------------- */

cfBtn.addEventListener("click", async () => {

  const handle = cfHandleInput.value.trim();

  if (!handle) {
    showStatus("Enter a Codeforces handle.", "err");
    return;
  }

  await chrome.storage.local.set({
    codeforcesHandle: handle
  });

  markButtonSaved(cfBtn);
  codeforcesPreview.textContent = `@${handle}`;

  showStatus("Codeforces handle saved.");
});

/* ---------------- SAVE LEETCODE HANDLE ---------------- */

leetcodeBtn.addEventListener("click", async () => {

  const handle = leetcodeHandleInput.value.trim();

  if (!handle) {
    showStatus("Enter a LeetCode handle.", "err");
    return;
  }

  await chrome.storage.local.set({
    leetcodeHandle: handle
  });

  markButtonSaved(leetcodeBtn);
  leetcodePreview.textContent = `@${handle}`;

  showStatus("LeetCode handle saved.");
});

/* ---------------- RESET BUTTONS WHEN INPUT CHANGES ---------------- */

ownerInput.addEventListener("input", () => {
  resetButton(repoBtn, "Save Repository");
});

repoInput.addEventListener("input", () => {
  resetButton(repoBtn, "Save Repository");
});

cfHandleInput.addEventListener("input", () => {
  resetButton(cfBtn, "Save Handle");
});

leetcodeHandleInput.addEventListener("input", () => {
  resetButton(leetcodeBtn, "Save Handle");
});

/* ---------------- INITIAL RENDER ---------------- */

render();