import { useState, useEffect } from "react";

const HEADLINE = "Every accepted solution, committed automatically.";

// ---- Signature element: typewriter headline, the one motion on the page ----
function Typewriter({ text, speed = 32 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [count, text, speed]);

  return (
    <>
      {text.slice(0, count)}
      <span className="inline-block w-[3px] h-[0.9em] bg-black align-middle ml-0.5 animate-pulse" />
    </>
  );
}

function Logo(props) {
  return (
    <svg viewBox="0 0 100 100" width="22" height="22" {...props}>
      <path d="M36 28 L18 50 L36 72" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M64 28 L82 50 L64 72" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="38" y1="50" x2="44.5" y2="50" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <line x1="55.5" y1="50" x2="62" y2="50" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <circle cx="50" cy="50" r="8.5" fill="currentColor" />
    </svg>
  );
}

function GitCommitIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3" />
      <line x1="5" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function PuzzleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-1.658-.503 2.001 2.001 0 0 0-1.398-1.4 2.002 2.002 0 0 0-2.267.9 2.002 2.002 0 0 0 .066 2.246 2 2 0 0 0 1.634.87.977.977 0 0 1 .762 1.664l-1.61 1.61a2.404 2.404 0 0 1-3.408 0l-1.568-1.568a1 1 0 0 0-.878-.288 2 2 0 1 1-2.253-2.253 1 1 0 0 0-.288-.878L5.05 15.239a2.4 2.4 0 0 1 0-3.408l1.611-1.611a.98.98 0 0 1 1.658.503 2 2 0 1 0 2.253-2.253.98.98 0 0 1-.503-1.658L11.68 5.2a2.404 2.404 0 0 1 3.408 0l1.568 1.568c.23.23.556.338.878.289a2 2 0 1 1 2.253 2.253" />
    </svg>
  );
}

function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  );
}

function GithubIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

const STEPS = [
  { n: "01", title: "Solve", body: "Submit on Codeing Platform." },
  { n: "02", title: "Detect", body: "Extension confirms the verdict is Accepted." },
  { n: "03", title: "Extract", body: "Problem, language, and source are read." },
  { n: "04", title: "Commit", body: "Pushed straight to your GitHub repo." },
];

function FlowStep({ step, isLast }) {
  return (
    <div className="flex-1 flex flex-col items-center text-center px-2">
      {/* Connector row: fixed height, matches circle height exactly, so the
          line/arrow always sit at the circle's vertical center regardless
          of how tall the text below ends up being. */}
      <div className="w-full h-14 flex items-center relative">
        <div className="w-14 h-14 rounded-full border border-black bg-white flex items-center justify-center text-[13px] font-mono mx-auto z-10">
          {step.n}
        </div>
        {!isLast && (
          <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-full h-px bg-[#D0D0D0] flex items-center">
            <ArrowRightIcon className="w-3.5 h-3.5 text-[#B0B0B0] ml-auto -mr-1.5" />
          </div>
        )}
      </div>
      <div className="text-[14px] font-semibold mt-3 mb-1">{step.title}</div>
      <div className="text-[12.5px] text-[#6B6B6B] leading-snug max-w-[130px]">
        {step.body}
      </div>
    </div>
  );
}

export default function CodeConnectHomepageMono() {
  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');
        .cc-mono { font-family: 'JetBrains Mono', monospace; }
        .cc-sans { font-family: 'Inter', sans-serif; }
      `}</style>

      {/* Nav */}
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between cc-sans">
        <div className="flex items-center gap-2 text-black">
          <Logo />
          <span className="cc-mono text-[26px] font-bold tracking-tight">
            Code<span className="font-medium text-[#8A8A8A]">Commit</span>
          </span>
        </div>
        <a href="#download" className="text-[13px] text-[#6B6B6B] hover:text-black transition-colors">
          Add to Chrome
        </a>
      </header>

      {/* Hero — centered, typewriter headline, centered CTA */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-20 text-center">
        <h1 className="cc-mono text-[26px] sm:text-[30px] leading-[1.35] font-medium tracking-tight min-h-[80px] sm:min-h-[64px]">
          <Typewriter text={HEADLINE} />
        </h1>
        <p className="cc-sans text-[14.5px] text-[#6B6B6B] leading-relaxed mt-5 mb-9 max-w-md mx-auto">
          CodeCommit watches your submissions and pushes every accepted
          solution to GitHub — sorted, named, and tagged. No copy-pasting.
        </p>
        <a
          id="download"
          href="../popup.html"
          className="cc-sans inline-flex items-center gap-2 bg-black hover:bg-[#222] text-white text-[14px] font-medium rounded-full px-6 py-3 transition-colors"
        >
          <PuzzleIcon className="w-4 h-4" />
          Add to Chrome
        </a>
      </section>

      {/* Horizontal workflow */}
      <section className="max-w-4xl mx-auto px-6 pb-24 cc-sans">
        <div className="text-[11px] uppercase tracking-wider text-[#9B9B9B] text-center mb-10">
          How it works
        </div>
        <div className="hidden sm:flex items-stretch">
          {STEPS.map((s, i) => (
            <FlowStep key={s.n} step={s} isLast={i === STEPS.length - 1} />
          ))}
        </div>
        {/* stacked fallback for narrow viewports */}
        <div className="sm:hidden flex flex-col gap-6">
          {STEPS.map((s) => (
            <div key={s.n} className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-full border border-black flex items-center justify-center text-[12px] font-mono">
                {s.n}
              </div>
              <div>
                <div className="text-[14px] font-semibold mb-0.5">{s.title}</div>
                <div className="text-[12.5px] text-[#6B6B6B] leading-snug">{s.body}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA — centered again */}
      <section className="max-w-2xl mx-auto px-6 pb-24 text-center border-t border-[#EAEAEA] pt-16">
        <h2 className="cc-mono text-[19px] font-medium mb-3">
          Your practice deserves a paper trail.
        </h2>
        <p className="cc-sans text-[13.5px] text-[#6B6B6B] mb-8">
          Free and open-source. Only pushes to the repo you choose.
        </p>
        <a
          href="#"
          className="cc-sans inline-flex items-center gap-2 bg-black hover:bg-[#222] text-white text-[14px] font-medium rounded-full px-6 py-3 transition-colors"
        >
          <PuzzleIcon className="w-4 h-4" />
          Add to Chrome
        </a>
      </section>

      <footer className="max-w-4xl mx-auto px-6 py-8 border-t border-[#EAEAEA] cc-sans">
        <div className="flex items-center justify-center gap-4 mb-4">
          <a
            href="https://github.com/flamekaiser007/codecommit"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="text-[#6B6B6B] hover:text-black transition-colors"
          >
            <GithubIcon />
          </a>
          <a
            href="https://www.instagram.com/135_arpit/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-[#6B6B6B] hover:text-black transition-colors"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://www.linkedin.com/in/arpit-maurya-2151b0330?utm_source=share_via&utm_content=profile&utm_medium=member_ios"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
            className="text-[#6B6B6B] hover:text-black transition-colors"
          >
            <LinkedinIcon />
          </a>
        </div>
        <div className="text-[12px] text-[#9B9B9B] text-center">
          © {new Date().getFullYear()} CodeCommit
        </div>
        <div className="text-[12px] text-[#9B9B9B] text-center">
          All rights reserved.
        </div>
        <div className="text-[12px] text-[#9B9B9B] text-center">
          Made with ❤️ by Arpit Maurya
        </div>
      </footer>
    </div>
  );
}