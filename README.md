<div align="center">

# 🚀 CodeCommit

### Your competitive programming solutions, automatically committed to GitHub.

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
  <img src="https://img.shields.io/badge/GitHub-API-181717?style=for-the-badge&logo=github"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Express-black?style=for-the-badge&logo=express"/>
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black"/>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/flamekaiser007/CodeCommit?style=social"/>
  <img src="https://img.shields.io/github/last-commit/flamekaiser007/CodeCommit?color=blue"/>
  <img src="https://img.shields.io/badge/status-active-success"/>
</p>

**No more copy-pasting solutions into GitHub by hand.**
CodeCommit detects your accepted submissions on coding platforms and pushes them straight to your repository — organized, version-controlled, and portfolio-ready.

<br/>

[Installation](#-installation) •
[Features](#-features) •
[How It Works](#-how-it-works) •
[Roadmap](#-roadmap) •
[Contributing](#-contributing)

</div>

---

## 🎬 Preview

> *Add a demo GIF or screenshots here — this is prime real estate, show the extension detecting a submission and the commit landing on GitHub.*

<div align="center">

```
LeetCode  ➜  ✅ Accepted  ➜  CodeCommit Extension  ➜  Backend  ➜  🐙 GitHub
```

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

- ⚡ **Zero manual uploads** — fully automatic
- 🔐 **Secure GitHub OAuth** login
- 🧩 **Lightweight Chrome extension**
- 📁 **Smart repository selection**

</td>
<td width="50%">

- 🗂️ **Organized folder structure** per topic
- 🌍 **Multi-platform support** (growing)
- 🚀 **Fast**, no noticeable lag on submit
- 🔒 Tokens never stored in the extension

</td>
</tr>
</table>

---

## 🌍 Supported Platforms

| Platform | Status |
|:--|:--:|
| 🟢 LeetCode | ✅ Live |
| 🟢 Codeforces | ✅ Live |
| 🟡 HackerRank | 🚧 Coming Soon |
| 🟡 CodeChef | 🚧 Coming Soon |
| 🟡 AtCoder | 🚧 Coming Soon |

---

## 🏗️ How It Works

```mermaid
flowchart TD
    A[Coding Platform] -->|Submit Solution| B[Chrome Extension]
    B -->|Detect Verdict| C{Accepted?}
    C -->|No| A
    C -->|Yes| D[Extract Code]
    D --> E[Backend Server]
    E -->|GitHub OAuth| F[Authenticate]
    F --> G[Create Commit]
    G --> H[(GitHub Repository)]
```

---

## 🔐 Authentication Flow

CodeCommit uses **GitHub OAuth** — your Personal Access Token is never stored inside the extension itself.

```mermaid
sequenceDiagram
    participant Ext as Extension
    participant BE as Backend
    participant GH as GitHub OAuth

    Ext->>BE: Request login
    BE->>GH: Redirect for authorization
    GH-->>BE: Return session token
    BE-->>Ext: Secure session established
    Ext->>BE: Authenticated API calls
```

---

## 📂 Project Structure

```
CodeCommit/
├── codeconnect-web/          # Chrome extension
│   ├── popup.html
│   ├── popup.js
│   ├── background.js
│   ├── manifest.json
│   └── content-scripts/
│
├── codeconnect-backend/      # API + GitHub integration
│   ├── routes/
│   ├── controllers/
│   ├── lib/
│   ├── db/
│   └── server.js
│
└── README.md
```

---

## ⚙️ Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | React, HTML, CSS, JavaScript, Chrome Extension API |
| **Backend** | Node.js, Express.js, JWT, GitHub OAuth |
| **APIs** | GitHub REST API, Chrome Identity API |

---

## 🚀 Installation

**1. Clone the repository**
```bash
git clone https://github.com/flamekaiser007/CodeCommit.git
```

**2. Set up the backend**
```bash
cd codeconnect-backend
npm install
npm start
```

**3. Set up the frontend**
```bash
cd codeconnect-web
npm install
npm run dev
```

**4. Load the Chrome extension**
```
chrome://extensions  →  Enable Developer Mode  →  Load Unpacked  →  Select codeconnect-web
```

---

## 📁 Example Output

Once connected, your solved problems land in your GitHub repo like this:

```
LeetCode/
├── Arrays/
│   ├── Two Sum.cpp
│   └── Best Time to Buy Stock.cpp
├── Trees/
│   └── Binary Tree Paths.cpp
└── Graphs/
    └── Number of Islands.cpp
```

---

## 🎯 Roadmap

- [x] GitHub Authentication
- [x] Chrome Extension
- [x] Backend Server
- [x] Repository Selection
- [ ] Auto folder organization by topic
- [ ] Daily commit statistics
- [ ] Contest tracking
- [ ] Difficulty badges
- [ ] AI-generated code explanations
- [ ] Browser dashboard
- [ ] Multiple GitHub accounts
- [ ] VS Code integration

---

## 🔮 Future Vision

CodeCommit aims to become the **GitHub companion for competitive programmers** — with:

- 🤖 AI-generated README per solved problem
- 📝 Smart, automatic commit messages
- 📊 Contest history & progress analytics
- 🔥 Coding streak tracking
- 🌡️ Difficulty heatmaps
- 🔄 Multi-platform synchronization

---

## 🤝 Contributing

Contributions are always welcome!

```bash
# 1. Fork the repository

# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m "Added amazing feature"

# 4. Push to your branch
git push origin feature/amazing-feature

# 5. Open a Pull Request
```

---

<div align="center">

## ⭐ Support the Project

If CodeCommit saved you time, consider giving it a star — it really helps!

<br/>

**Built with ❤️ by [Arpit Maurya](https://github.com/flamekaiser007)**

*"Every accepted solution deserves a commit."*

</div>

