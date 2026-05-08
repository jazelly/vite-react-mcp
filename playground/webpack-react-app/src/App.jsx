import { useMemo, useState } from 'react';

const prompts = [
  {
    id: 'tree',
    label: 'Map the component tree',
    value:
      'Inspect the current page and summarize the React component tree with source context.',
    tool: 'get-component-tree',
    output: [
      'App',
      '  LandingShell',
      '    HeroPrompt',
      '      PromptComposer',
      '      RuntimePreview',
      '    FeatureMatrix',
      '    BridgeTimeline',
    ],
  },
  {
    id: 'state',
    label: 'Read live component state',
    value:
      'Find the prompt composer and explain its props, local state, and rendered output.',
    tool: 'get-component-states',
    output: [
      'component: PromptComposer',
      'state.prompt = user editable request',
      'state.activePreset = "state"',
      'props.onRun = function dispatchPrompt()',
    ],
  },
  {
    id: 'highlight',
    label: 'Highlight a component',
    value:
      'Highlight the HeroPrompt component and show where it renders in the browser.',
    tool: 'highlight-component',
    output: [
      'Found HeroPrompt',
      'Applied runtime outline',
      'Returned DOM candidates for live inspection',
    ],
  },
];

const features = [
  {
    title: 'MCP tools in your dev server',
    body: 'Expose component tree, state, context, HTML search, selection capture, and custom tools through a local MCP endpoint.',
    stat: '/sse',
  },
  {
    title: 'Live browser runtime',
    body: 'Inject a small runtime into the React app so tool calls execute against the page your user is actually seeing.',
    stat: 'window.__VITE_REACT_MCP__',
  },
  {
    title: 'Source-aware selection',
    body: 'Capture selected DOM, resolved React components, and source snippets so agents can work with real UI context.',
    stat: 'selection context',
  },
  {
    title: 'Custom tool pipeline',
    body: 'Register project-specific JS or TS functions and make them available beside the built-in React inspection tools.',
    stat: 'customTools[]',
  },
];

const bridgeSteps = [
  {
    title: 'Plugin injects runtime',
    body: 'Vite, Webpack, or Next dev config prepends the client runtime and overlay.',
  },
  {
    title: 'MCP client calls a tool',
    body: 'Your editor or agent connects to the same local app server via SSE.',
  },
  {
    title: 'Bridge reaches the page',
    body: 'The request moves through the runtime bridge into the active browser tab.',
  },
  {
    title: 'React context returns',
    body: 'The tool reads live fibers, DOM, state, or source context and replies to the agent.',
  },
];

const toolRows = [
  ['highlight-component', 'Visually locate React components in the page'],
  ['get-component-tree', 'Return an ASCII tree for the rendered React app'],
  ['get-component-states', 'Read props, state, and context from live components'],
  ['get-unnecessary-rerenders', 'Inspect wasted render activity during development'],
  ['get-react-source-code', 'Find UI by text and return source-aware context'],
];

function Icon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  if (name === 'bolt') {
    return (
      <svg {...common}>
        <path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" />
      </svg>
    );
  }

  if (name === 'nodes') {
    return (
      <svg {...common}>
        <circle cx="6" cy="7" r="3" />
        <circle cx="18" cy="7" r="3" />
        <circle cx="12" cy="18" r="3" />
        <path d="M8.6 9.1 10.7 15" />
        <path d="M15.4 9.1 13.3 15" />
      </svg>
    );
  }

  if (name === 'terminal') {
    return (
      <svg {...common}>
        <path d="m5 8 4 4-4 4" />
        <path d="M11 16h8" />
        <rect x="3" y="4" width="18" height="16" rx="2.5" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m7 7 10 10" />
      <path d="m17 7-10 10" />
    </svg>
  );
}

function AppStyles() {
  return (
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');

        :root {
          color-scheme: dark;
          --bg: #04070d;
          --panel: rgba(9, 17, 31, 0.82);
          --panel-strong: rgba(11, 23, 42, 0.96);
          --line: rgba(125, 211, 252, 0.18);
          --line-strong: rgba(56, 189, 248, 0.38);
          --text: #e5f4ff;
          --muted: #8ea8bd;
          --subtle: #64798d;
          --cyan: #22d3ee;
          --blue: #60a5fa;
          --green: #34d399;
          --orange: #fb923c;
          --shadow: 0 24px 80px rgba(0, 0, 0, 0.46);
          font-family: 'DM Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: var(--bg);
        }

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          min-width: 320px;
          background: var(--bg);
        }

        button,
        textarea {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .page {
          min-height: 100vh;
          color: var(--text);
          background:
            radial-gradient(circle at 20% 8%, rgba(34, 211, 238, 0.24), transparent 28rem),
            radial-gradient(circle at 82% 16%, rgba(96, 165, 250, 0.18), transparent 24rem),
            linear-gradient(180deg, #050914 0%, #07101e 48%, #03060b 100%);
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(148, 163, 184, 0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.055) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.86), transparent 76%);
        }

        .shell {
          position: relative;
          z-index: 1;
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .nav {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--text);
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          letter-spacing: 0;
          text-decoration: none;
        }

        .brand-mark {
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 1px solid var(--line-strong);
          border-radius: 8px;
          color: var(--cyan);
          background: linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(96, 165, 250, 0.08));
          box-shadow: 0 0 28px rgba(34, 211, 238, 0.16);
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
          color: var(--muted);
          font-size: 14px;
          font-weight: 700;
        }

        .nav-links a {
          color: inherit;
          text-decoration: none;
          transition: color 180ms ease-out;
        }

        .nav-links a:hover,
        .nav-links a:focus-visible {
          color: var(--text);
        }

        .hero {
          min-height: calc(100dvh - 76px);
          display: grid;
          grid-template-columns: minmax(0, 0.92fr) minmax(460px, 1.08fr);
          gap: 34px;
          align-items: center;
          padding: 34px 0 70px;
        }

        .hero-copy {
          max-width: 610px;
        }

        .system-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #b8ecff;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0;
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 11px;
          background: rgba(2, 8, 23, 0.56);
        }

        h1,
        h2,
        h3 {
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0;
        }

        h1 {
          margin: 22px 0 18px;
          font-size: clamp(48px, 7.2vw, 86px);
          line-height: 0.94;
          max-width: 760px;
        }

        .gradient-text {
          color: transparent;
          background: linear-gradient(92deg, #e0f7ff 0%, #67e8f9 46%, #93c5fd 100%);
          -webkit-background-clip: text;
          background-clip: text;
        }

        .hero-copy p {
          margin: 0;
          color: #a8bed2;
          font-size: clamp(17px, 1.7vw, 20px);
          line-height: 1.62;
          max-width: 670px;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .button {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          border-radius: 8px;
          border: 1px solid var(--line-strong);
          padding: 0 16px;
          color: var(--text);
          background: rgba(15, 23, 42, 0.72);
          text-decoration: none;
          transition: transform 180ms ease-out, border-color 180ms ease-out, background 180ms ease-out;
        }

        .button:hover,
        .button:focus-visible {
          transform: translateY(-1px);
          border-color: rgba(125, 211, 252, 0.72);
          background: rgba(15, 23, 42, 0.96);
        }

        .button.primary {
          color: #031016;
          border-color: rgba(34, 211, 238, 0.82);
          background: linear-gradient(135deg, #67e8f9, #60a5fa);
          box-shadow: 0 16px 48px rgba(34, 211, 238, 0.24);
          font-weight: 800;
        }

        .proof-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 32px;
        }

        .proof {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          padding: 14px;
          background: rgba(8, 14, 26, 0.7);
        }

        .proof strong {
          display: block;
          color: #e8fbff;
          font-size: 22px;
          font-family: 'Space Grotesk', sans-serif;
          margin-bottom: 4px;
        }

        .proof span {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.45;
        }

        .prompt-card {
          position: relative;
          border: 1px solid rgba(125, 211, 252, 0.28);
          border-radius: 8px;
          background:
            linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 8, 23, 0.94)),
            rgba(2, 8, 23, 0.94);
          box-shadow: var(--shadow), 0 0 80px rgba(34, 211, 238, 0.09);
          overflow: hidden;
        }

        .prompt-card::before {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.22), transparent);
          transform: translateX(-100%);
          animation: panel-scan 4.8s ease-in-out infinite;
        }

        .prompt-topbar {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 0 16px;
          border-bottom: 1px solid rgba(125, 211, 252, 0.14);
          color: #c5eeff;
          font-size: 13px;
          font-weight: 800;
        }

        .window-dots {
          display: inline-flex;
          gap: 7px;
        }

        .window-dots span {
          width: 9px;
          height: 9px;
          border-radius: 999px;
          background: var(--cyan);
          opacity: 0.72;
        }

        .prompt-body {
          padding: 18px;
        }

        .preset-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 14px;
        }

        .preset {
          min-height: 48px;
          text-align: left;
          color: var(--muted);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.58);
          padding: 10px;
          transition: transform 180ms ease-out, border-color 180ms ease-out, color 180ms ease-out;
        }

        .preset.active {
          color: #ecfeff;
          border-color: rgba(34, 211, 238, 0.62);
          background: rgba(8, 47, 73, 0.56);
        }

        .prompt-label {
          display: block;
          color: #d8f6ff;
          font-size: 13px;
          font-weight: 800;
          margin-bottom: 9px;
        }

        .prompt-input {
          width: 100%;
          min-height: 126px;
          resize: vertical;
          color: #e6fbff;
          border: 1px solid rgba(125, 211, 252, 0.22);
          border-radius: 8px;
          background: rgba(3, 7, 18, 0.72);
          padding: 14px;
          line-height: 1.55;
          outline: none;
          transition: border-color 180ms ease-out, box-shadow 180ms ease-out;
        }

        .prompt-input:focus {
          border-color: rgba(34, 211, 238, 0.8);
          box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.14);
        }

        .run-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-top: 14px;
        }

        .status-line {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--muted);
          font-size: 13px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--green);
          box-shadow: 0 0 18px rgba(52, 211, 153, 0.72);
        }

        .output {
          margin-top: 16px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 8px;
          background: rgba(1, 6, 14, 0.82);
          overflow: hidden;
        }

        .output-header {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          color: #b7ecff;
          font-size: 13px;
          font-weight: 800;
        }

        .output-lines {
          margin: 0;
          padding: 14px;
          min-height: 140px;
          color: #b6f4c8;
          font: 500 13px/1.75 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          white-space: pre-wrap;
        }

        .typing-line {
          display: block;
          opacity: 0;
          transform: translateY(8px);
          animation: line-in 260ms ease-out forwards;
        }

        .section {
          padding: 90px 0;
        }

        .section-heading {
          max-width: 760px;
          margin-bottom: 28px;
        }

        .section-heading h2 {
          margin: 0 0 12px;
          font-size: clamp(34px, 4vw, 56px);
          line-height: 1;
        }

        .section-heading p {
          margin: 0;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.65;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .feature {
          min-height: 250px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(125, 211, 252, 0.16);
          border-radius: 8px;
          padding: 18px;
          background: rgba(8, 16, 31, 0.74);
          transition: transform 180ms ease-out, border-color 180ms ease-out;
        }

        .feature:hover {
          transform: translateY(-3px);
          border-color: rgba(34, 211, 238, 0.46);
        }

        .feature h3 {
          margin: 16px 0 10px;
          font-size: 20px;
        }

        .feature p {
          margin: 0;
          color: var(--muted);
          line-height: 1.58;
        }

        .feature-stat {
          width: fit-content;
          color: #041016;
          background: linear-gradient(135deg, #67e8f9, #34d399);
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 900;
        }

        .bridge {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
          gap: 22px;
          align-items: stretch;
        }

        .timeline {
          display: grid;
          gap: 12px;
        }

        .step {
          display: grid;
          grid-template-columns: 42px 1fr;
          gap: 12px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 8px;
          padding: 14px;
          background: rgba(9, 17, 31, 0.72);
        }

        .step-number {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: var(--cyan);
          background: rgba(34, 211, 238, 0.1);
          border: 1px solid rgba(34, 211, 238, 0.24);
          font-weight: 900;
        }

        .step h3 {
          margin: 0 0 5px;
          font-size: 17px;
        }

        .step p {
          margin: 0;
          color: var(--muted);
          line-height: 1.55;
        }

        .code-panel {
          border: 1px solid rgba(125, 211, 252, 0.2);
          border-radius: 8px;
          background: rgba(1, 6, 14, 0.9);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .code-panel pre {
          margin: 0;
          padding: 18px;
          overflow: auto;
          color: #c8f7d4;
          font: 500 13px/1.7 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        }

        .tool-table {
          border: 1px solid rgba(125, 211, 252, 0.16);
          border-radius: 8px;
          overflow: hidden;
          background: rgba(8, 16, 31, 0.78);
        }

        .tool-row {
          display: grid;
          grid-template-columns: minmax(220px, 0.45fr) 1fr;
          gap: 16px;
          padding: 16px;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .tool-row:first-child {
          border-top: 0;
        }

        .tool-row code {
          color: #67e8f9;
          font-size: 13px;
        }

        .tool-row span {
          color: var(--muted);
          line-height: 1.55;
        }

        .final-cta {
          margin-bottom: 80px;
          border: 1px solid rgba(34, 211, 238, 0.24);
          border-radius: 8px;
          padding: clamp(24px, 5vw, 52px);
          background:
            linear-gradient(135deg, rgba(34, 211, 238, 0.14), rgba(96, 165, 250, 0.08)),
            rgba(8, 16, 31, 0.84);
          box-shadow: var(--shadow);
        }

        .final-cta h2 {
          margin: 0 0 12px;
          font-size: clamp(32px, 4vw, 54px);
        }

        .final-cta p {
          max-width: 720px;
          margin: 0 0 24px;
          color: var(--muted);
          font-size: 17px;
          line-height: 1.65;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        #webpack-copy-target {
          color: #8ea8bd;
        }

        @keyframes panel-scan {
          0%, 58% { transform: translateX(-100%); opacity: 0; }
          68% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes line-in {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 980px) {
          .nav {
            align-items: flex-start;
            flex-direction: column;
            padding: 18px 0;
          }

          .hero,
          .bridge {
            grid-template-columns: 1fr;
          }

          .prompt-card {
            max-width: 720px;
          }

          .feature-grid,
          .proof-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .shell {
            width: min(100% - 28px, 1180px);
          }

          .nav-links {
            width: 100%;
            justify-content: space-between;
            gap: 10px;
            font-size: 13px;
          }

          .hero {
            padding-top: 18px;
          }

          .hero-actions,
          .run-row {
            align-items: stretch;
            flex-direction: column;
          }

          .button,
          .button.primary {
            width: 100%;
          }

          .preset-row,
          .feature-grid,
          .proof-strip,
          .tool-row {
            grid-template-columns: 1fr;
          }

          .section {
            padding: 64px 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}
    </style>
  );
}

function PromptConsole() {
  const [activePromptId, setActivePromptId] = useState(prompts[0].id);
  const [prompt, setPrompt] = useState(prompts[0].value);
  const [runCount, setRunCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const activePrompt = useMemo(
    () => prompts.find((item) => item.id === activePromptId) || prompts[0],
    [activePromptId],
  );

  const outputLines = useMemo(() => {
    const prefix = runCount === 0 ? 'ready' : `run ${runCount}`;
    return [
      `$ ${activePrompt.tool} --live-browser`,
      `status: ${isRunning ? 'streaming browser context' : prefix}`,
      `prompt: ${prompt}`,
      ...activePrompt.output,
    ];
  }, [activePrompt, isRunning, prompt, runCount]);

  const selectPrompt = (item) => {
    setActivePromptId(item.id);
    setPrompt(item.value);
  };

  const runPrompt = () => {
    setIsRunning(true);
    window.setTimeout(() => {
      setRunCount((value) => value + 1);
      setIsRunning(false);
    }, 420);
  };

  return (
    <section className="prompt-card" aria-label="Interactive MCP prompt demo">
      <div className="prompt-topbar">
        <span className="window-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span>live prompt console</span>
        <span className="status-line">
          <span className="status-dot" />
          bridge ready
        </span>
      </div>
      <div className="prompt-body">
        <div className="preset-row" aria-label="Prompt examples">
          {prompts.map((item) => (
            <button
              className={`preset ${item.id === activePromptId ? 'active' : ''}`}
              key={item.id}
              type="button"
              onClick={() => selectPrompt(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <label className="prompt-label" htmlFor="mcp-prompt">
          Ask an agent to inspect your React app
        </label>
        <textarea
          className="prompt-input"
          id="mcp-prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />

        <div className="run-row">
          <span className="status-line" aria-live="polite">
            <span className="status-dot" />
            {isRunning ? 'Streaming tool result...' : 'Try a prompt locally'}
          </span>
          <button
            className="button primary"
            id="webpack-counter"
            type="button"
            onClick={runPrompt}
            disabled={isRunning}
          >
            <Icon name="bolt" />
            {isRunning ? 'Running...' : `Run prompt (${runCount})`}
          </button>
        </div>

        <div className="output">
          <div className="output-header">
            <span>{activePrompt.tool}</span>
            <span>{runCount === 0 ? 'preview' : 'generated'}</span>
          </div>
          <pre className="output-lines" aria-live="polite">
            {outputLines.map((line, index) => (
              <span
                className="typing-line"
                key={`${line}-${runCount}-${index}`}
                style={{ animationDelay: `${index * 55}ms` }}
              >
                {line}
                {'\n'}
              </span>
            ))}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-copy">
        <span className="system-label">
          <Icon name="nodes" />
          React context for AI coding agents
        </span>
        <h1 id="webpack-title">
          Let agents inspect your <span className="gradient-text">live React app</span>.
        </h1>
        <p>
          vite-react-mcp starts an MCP server inside your dev workflow so agents can
          read component trees, inspect state, highlight UI, capture source-aware
          selections, and call your own custom tools.
        </p>
        <div className="hero-actions">
          <a className="button primary" href="#try">
            <Icon name="terminal" />
            Try the prompt
          </a>
          <a className="button" href="#features">
            Explore features
          </a>
        </div>
        <div className="proof-strip" aria-label="Repository highlights">
          <div className="proof">
            <strong>5+</strong>
            <span>built-in inspection tools for React development</span>
          </div>
          <div className="proof">
            <strong>dev</strong>
            <span>designed for local Vite, Webpack, and Next workflows</span>
          </div>
          <div className="proof">
            <strong>MCP</strong>
            <span>HTTP/SSE endpoint ready for agent clients</span>
          </div>
        </div>
      </div>
      <div id="try">
        <PromptConsole />
      </div>
    </section>
  );
}

function FeatureMatrix() {
  return (
    <section className="section" id="features">
      <div className="section-heading">
        <h2>Everything an agent needs to understand the screen.</h2>
        <p>
          The plugin links browser runtime context to MCP tools, giving coding
          agents the same rendered UI signals a developer would inspect manually.
        </p>
      </div>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <article className="feature" key={feature.title}>
            <div>
              <Icon name={index % 2 === 0 ? 'nodes' : 'terminal'} />
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
            <span className="feature-stat">{feature.stat}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function BridgeTimeline() {
  return (
    <section className="section" id="how">
      <div className="bridge">
        <div className="section-heading">
          <h2>How the bridge works.</h2>
          <p>
            MCP requests move from your agent into the local dev server, then
            through the browser runtime where React fibers and DOM context are
            available.
          </p>
        </div>
        <div className="timeline">
          {bridgeSteps.map((step, index) => (
            <article className="step" key={step.title}>
              <div className="step-number">{index + 1}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function InstallPanel() {
  return (
    <section className="section" id="install">
      <div className="bridge">
        <div className="code-panel">
          <div className="prompt-topbar">
            <span>vite.config.ts</span>
            <span>minimal setup</span>
          </div>
          <pre>{`import ReactMCP from 'vite-react-mcp'

export default defineConfig({
  plugins: [
    ReactMCP({
      customTools: [
        // your project-specific tools
      ],
    }),
  ],
})`}</pre>
        </div>
        <div>
          <div className="section-heading">
            <h2>Install it where your app already runs.</h2>
            <p>
              Add the plugin in development, point your MCP client at the app
              server, and keep using your existing React project structure.
            </p>
          </div>
          <a className="button primary" href="#tools">
            <Icon name="bolt" />
            See built-in tools
          </a>
        </div>
      </div>
    </section>
  );
}

function ToolTable() {
  return (
    <section className="section" id="tools">
      <div className="section-heading">
        <h2>Built for live UI investigation.</h2>
        <p>
          Start with the built-in tools, then add custom tools that know your
          application domain.
        </p>
      </div>
      <div className="tool-table">
        {toolRows.map(([name, description]) => (
          <div className="tool-row" key={name}>
            <code>{name}</code>
            <span>{description}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <h2>Give your agent browser-native React context.</h2>
      <p id="webpack-copy-target">
        Selection source test content for Webpack. This landing page keeps the
        playground selection target available while presenting the repo as a
        production-grade developer tool.
      </p>
      <div className="hero-actions">
        <a className="button primary" href="#try">
          <Icon name="terminal" />
          Run the prompt demo
        </a>
        <a className="button" href="#install">
          Install path
        </a>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <div className="page">
      <AppStyles />
      <nav className="nav shell" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="Vite React MCP home">
          <span className="brand-mark">
            <Icon name="bolt" />
          </span>
          <span>vite-react-mcp</span>
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">Bridge</a>
          <a href="#install">Install</a>
          <a href="#tools">Tools</a>
        </div>
      </nav>
      <main className="shell" id="top">
        <Hero />
        <FeatureMatrix />
        <BridgeTimeline />
        <InstallPanel />
        <ToolTable />
        <FinalCta />
      </main>
    </div>
  );
}
