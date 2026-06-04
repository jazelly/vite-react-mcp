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

This adapter injects `@agentic-react/core` into the browser runtime, attaches the local runtime bridge to the Vite dev server, and exposes MCP endpoints at `/sse` and `/messages`.
