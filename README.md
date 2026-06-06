# Agentic React

Agentic React is a monorepo for React runtime inspection and local-dev MCP integrations. The packages are published under the `@agentic-react` namespace.

## Demos

### Single Select

<video src="./playground/demo/demo1-single-select.mp4" controls></video>

### Multiselect

<video src="./playground/demo/demo2-multiselect.mp4" controls></video>

## Packages

- `@agentic-react/core`: bundler-agnostic browser runtime, React selection toolkit, and MCP primitives.
- `@agentic-react/vite`: Vite adapter for local dev.
- `@agentic-react/webpack`: Webpack adapter for local dev.
- `@agentic-react/next`: Next.js adapter for local dev.

For full local-dev features, install the adapter for your bundler. The adapter depends on `@agentic-react/core` internally, so app users do not need to import both packages.

## Local Dev Usage

### Vite

```bash
pnpm install @agentic-react/vite -D
```

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import AgenticReact from '@agentic-react/vite';

export default defineConfig({
  plugins: [AgenticReact()],
});
```

The Vite adapter injects the core browser runtime, attaches the runtime bridge to the dev server, and exposes MCP over:

```text
http://localhost:<vite-port>/mcp
```

### Webpack

```bash
pnpm install @agentic-react/webpack -D
```

```js
// webpack.config.mjs
import withAgenticReactWebpack from '@agentic-react/webpack';

export default (env, argv) =>
  withAgenticReactWebpack(config, { mode: argv.mode });
```

The Webpack adapter prepends a generated runtime entry, attaches the runtime bridge to webpack-dev-server, and exposes MCP at:

```text
http://localhost:<webpack-dev-server-port>/mcp
```

### Next.js

```bash
pnpm install @agentic-react/next -D
```

```js
// next.config.mjs
import withAgenticReactNext from '@agentic-react/next';

export default withAgenticReactNext(nextConfig);
```

The Next adapter injects the browser runtime through Next's Webpack config and starts a local bridge server. By default MCP is available at:

```text
http://127.0.0.1:51426/mcp
```

## Runtime-Only Usage

Use `@agentic-react/core` directly when you only need browser-side selection/runtime APIs and do not need local source-file lookup or MCP dev-server wiring.

```bash
pnpm install @agentic-react/core
```

```ts
import { createSelectionToolkit } from '@agentic-react/core';

const toolkit = createSelectionToolkit();
toolkit.enable();
```

Runtime-only mode can inspect the live browser tree, but it cannot read or edit local files. Source lookup and local MCP transport are the adapter layer's job.

## What Adapters Add

`@agentic-react/core` runs in the browser and can select elements, inspect React fibers, highlight components, format selection context, and expose `window.__AGENTIC_REACT__` / `window.__AGENTIC_REACT_TOOLS__`.

Bundler adapters add local-dev capabilities that the runtime cannot know on its own:

- inject the core runtime automatically
- attach a local MCP Streamable HTTP `/mcp` endpoint
- bridge MCP calls from Node to the browser runtime
- provide local source-root context for source lookup
- keep dev-only tooling out of production bundles

## Custom Tools

Adapters accept browser-side custom tools. Import shared types from the adapter package you use:

```ts
import type { ToolResultValue } from '@agentic-react/vite';

export default function logMessage(args: { message: string }): ToolResultValue {
  return {
    success: true,
    message: `Received: ${args.message}`,
  };
}
```

```ts
import { defineConfig } from 'vite';
import AgenticReact from '@agentic-react/vite';
import { z } from 'zod';
import logMessage from './src/tools/logMessage';

export default defineConfig({
  plugins: [
    AgenticReact({
      customTools: [
        {
          name: 'log-message',
          description: 'Log a message in the browser runtime',
          schema: z.object({ message: z.string() }),
          clientFunction: logMessage,
        },
      ],
    }),
  ],
});
```

## Development

```bash
pnpm run build
pnpm run playground:vite
pnpm run playground:webpack
pnpm run playground:next
pnpm run playground:nx-mf
```

For e2e automation, Playwright uses fixed local ports configured in the playground package configs.

## Acknowledgement

This project is inspired by [vite-plugin-vue-mcp](https://github.com/webfansplz/vite-plugin-vue-mcp).

## License

MIT
