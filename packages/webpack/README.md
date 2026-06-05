# @agentic-react/webpack

Webpack adapter for Agentic React local-dev MCP integration.

```bash
pnpm install @agentic-react/webpack -D
```

```js
import withAgenticReactWebpack from '@agentic-react/webpack';

export default (env, argv) =>
  withAgenticReactWebpack(config, { mode: argv.mode });
```

This adapter injects `@agentic-react/core` through a generated browser entry, attaches the local runtime bridge to webpack-dev-server, and exposes MCP over Streamable HTTP at `/mcp`.
