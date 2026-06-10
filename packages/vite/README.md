# @agentic-react/vite

Vite adapter for Agentic React local-dev MCP integration.

```bash
pnpm install @agentic-react/vite -D
```

```ts
import { defineConfig } from 'vite';
import AgenticReact from '@agentic-react/vite';

export default defineConfig({
  plugins: [AgenticReact()],
});
```

This adapter injects `@agentic-react/core` into the browser runtime, attaches the local runtime bridge to the Vite dev server, and exposes MCP over Streamable HTTP at `/mcp`.

## Tuning Modal Configuration

Pass tuning modal options through `AgenticReact({ toolkit })`. The `toolkit` object uses the shared `ToolkitConfig` shape; `toolkit.tuningModal` accepts `classNames`, `styles`, and `tokens`.

```ts
import { defineConfig } from 'vite';
import AgenticReact from '@agentic-react/vite';
import type { ToolkitConfig } from '@agentic-react/vite';

const toolkit: ToolkitConfig = {
  tuningModal: {
    classNames: {
      surface: 'vite-playground-tuning-surface',
      panel: 'vite-playground-tuning-panel',
      control: 'vite-playground-tuning-control',
    },
    tokens: {
      panelRadius: '14px',
      controlRadius: '10px',
      primaryButtonBackground: '#0f766e',
      primaryButtonColor: '#ffffff',
      panelShadow: '0 24px 72px rgba(15, 118, 110, 0.22)',
    },
    styles: {
      surface: {
        filter: 'drop-shadow(0 18px 40px rgba(15, 118, 110, 0.16))',
      },
      panel: {
        border: '1px solid rgba(15, 118, 110, 0.22)',
      },
      targetTag: {
        background: '#ecfeff',
        color: '#0f766e',
      },
      sectionTitle: {
        color: '#0f766e',
      },
    },
  },
};

export default defineConfig({
  plugins: [
    AgenticReact({
      toolkit,
    }),
  ],
});
```

This example is drawn from `playground/agentic-react-vite-playground/vite.config.js`. Slot names include `root`, `surface`, `panel`, `arrow`, `title`, `body`, `targetTag`, `customPromptForm`, `customPromptInput`, `customPromptButton`, `sectionTitle`, `row`, `label`, `controlWrap`, `control`, `colorInput`, `numberInput`, `stepperButton`, `select`, `textarea`, `suffix`, and `closeButton`.

Token names are camelCase and become `--agentic-react-tuning-*` CSS variables. For example, `panelRadius` maps to `--agentic-react-tuning-panel-radius`, while `primaryButtonBackground` maps to `--agentic-react-tuning-primary-button-background`.

For DOM-level extensions, register a runtime extension in browser code with `window.__AGENTIC_REACT__?.registerTuningModalExtension({ id, beforeFields, afterFields, footer, wrapModal })`. `wrapModal` receives the modal `surfaceElement` and `panelElement`; return a cleanup function when adding listeners or observers.
