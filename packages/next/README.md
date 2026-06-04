# @agentic-react/next

Next.js adapter for Agentic React local-dev MCP integration.

```bash
pnpm install @agentic-react/next -D
```

```js
import withAgenticReactNext from '@agentic-react/next';

export default withAgenticReactNext(nextConfig);
```

This adapter injects `@agentic-react/core` through Next's Webpack config and starts a local bridge server for MCP. By default the bridge runs at `http://127.0.0.1:51426/sse`.
