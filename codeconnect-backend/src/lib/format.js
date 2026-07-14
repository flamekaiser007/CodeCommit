const EXT_MAP = {
  python: "py",
  python3: "py",
  java: "java",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  javascript: "js",
  typescript: "ts",
  csharp: "cs",
  "c#": "cs",
  go: "go",
  golang: "go",
  ruby: "rb",
  swift: "swift",
  kotlin: "kt",
  rust: "rs",
  scala: "scala",
  php: "php",
};

export function extFor(language) {
  if (!language) return "txt";
  return EXT_MAP[language.toLowerCase()] || "txt";
}

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCommitPlan({ platform, title, language }) {
  const folder = `${platform}/${slugify(title)}`;
  return {
    path: `${folder}/solution.${extFor(language)}`,
    message: `${platform}: solved "${title}"`,
  };
}