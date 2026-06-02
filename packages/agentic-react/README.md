# @jazelly/agentic-react

A dev-only React plugin that creates an MCP server so coding agents can inspect and interact with a live React app across Vite, Webpack, and Next.js.

## Features

- Single package for Vite, Webpack, and Next.js dev setups.
- Local MCP server exposed from your dev server or local bridge at `/sse`.
- Browser runtime globals: `window.__AGENTIC_REACT__` and `window.__AGENTIC_REACT_TOOLS__`.
- Component highlighting by component name.
- React component tree inspection.
- Props, state, and context inspection.
- Unnecessary re-render detection.
- DOM selection to React source context lookup.
- Custom browser tools callable through MCP.

## Install

```bash
pnpm install @jazelly/agentic-react -D
```

## Vite

```ts
import { defineConfig } from 'vite';
import AgenticReact from '@jazelly/agentic-react';

export default defineConfig({
  plugins: [AgenticReact()],
});
```

MCP endpoint:

```text
http://localhost:<vite-port>/sse
```

## Webpack

```js
import withAgenticReactWebpack from '@jazelly/agentic-react/webpack';

export default (env, argv) =>
  withAgenticReactWebpack(config, { mode: argv.mode });
```

MCP endpoint:

```text
http://localhost:<webpack-dev-server-port>/sse
```

## Next.js

```js
import withAgenticReactNext from '@jazelly/agentic-react/next';

export default withAgenticReactNext(nextConfig);
```

Default MCP endpoint:

```text
http://127.0.0.1:51426/sse
```

## MCP

Run your React app in development and point your MCP client at the local SSE endpoint exposed by the plugin:

```json
{
  "mcpServers": {
    "@jazelly/agentic-react": {
      "url": "http://localhost:3000/sse"
    }
  }
}
```

The package injects `window.__AGENTIC_REACT__` and registers tools for component highlighting, React tree inspection, component state inspection, unnecessary render detection, and optional custom browser tools.

## Custom Tools

Define a browser-side tool:

```ts
import type { ToolResultValue } from '@jazelly/agentic-react';

export default function logMessage(args: { message: string }): ToolResultValue {
  return {
    success: true,
    message: args.message,
  };
}
```

Register it in your Vite config:

```ts
import { defineConfig } from 'vite';
import { z } from 'zod';
import AgenticReact from '@jazelly/agentic-react';
import logMessage from './src/tools/logMessage';

export default defineConfig({
  plugins: [
    AgenticReact({
      customTools: [
        {
          name: 'log-message',
          description: 'Log a message in the browser runtime.',
          schema: z.object({
            message: z.string(),
          }),
          clientFunction: logMessage,
        },
      ],
    }),
  ],
});
```

## License

MIT
