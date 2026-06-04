# @agentic-react/core

Bundler-agnostic Agentic React runtime primitives.

Use this package when you need browser-side React selection and inspection without Vite, Webpack, or Next.js adapter wiring.

```ts
import { createSelectionToolkit } from '@agentic-react/core';

const toolkit = createSelectionToolkit();
toolkit.enable();
```

For full local-dev MCP features, install an adapter instead:

- `@agentic-react/vite`
- `@agentic-react/webpack`
- `@agentic-react/next`

Adapters depend on `@agentic-react/core` internally and add runtime injection, bridge transport, MCP endpoints, and source-root context.
