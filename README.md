# vite-react-mcp

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]

A Vite plugin that creates an MCP server to help LLMs understand your React App context

## Features

- `highlight-component`
  - description: Highlight React component based on the component name.
  - params: 
    - `componentName`: string

  ![highlight-component](./playground/demo/demo_highlight_component.gif)

- `get-component-states`
  - description: Get the React component props, states, and contexts in JSON structure format.
  - params:
    - `componentName`: string

  ![get-component-states](./playground/demo/demo_get_states.gif)

- `get-component-tree`
  - description: Get the React component tree of the current page in ASCII format.
  - params:
    - `allComponent`: boolean, if truthy, return a tree for all components instead of your self-defined components only.

  ![get-component-tree](./playground/demo/demo_get_component_tree.gif)

- `get-unnecessary-rerenders`
  - description: Get the wasted re-rendered components of the current page.
  - params:
    - `timeframe`: number, if present, only get unnecessary renders within the last `timeframe` seconds. If not, get all unnecessary renders happened on the current page.
    - `allComponent`: boolean, if truthy, get unnecessary renders for all components instead of self-defined components only.

  ![get-unnecessary-rerenders](./playground/demo/demo_unnecessary_renders.gif)

- Custom Tools

  You can now define your own tool functions in JS/TS in your Vite project, and inject it
  to the plugin.

  ![custom-tools](./playground/demo/demo_custom_tools.gif)

## Getting Started

### Installation

```bash
pnpm install vite-react-mcp -D
```

You also need `@babel/preset-react` installed, as this plugins traverses AST to collect your React components names.

```bash
pnpm install @babel/preset-react
```

### Usage

#### Built-in tools

```ts
// vite.config.ts
import ReactMCP from 'vite-react-mcp'

export default defineConfig({
  plugins: [ReactMCP()],
})
```

#### Custom tools

Define your own tool in your Vite project, e.g.

```ts
// any ts file in your Vite project
import type { ToolResultValue } from 'vite-react-mcp';

export default function myCustomTool(args: { message: string }): ToolResultValue {
  const { message } = args;
  console.log(`[custom-tool/log1] ${message}`);
  return {
    success: true,
    message: `Log1 received: ${message}`,
  };
}
```

```ts
// vite.config.ts
import ReactMCP from 'vite-react-mcp'
import log1 from 'path/to/your/module'

export default defineConfig({
  plugins: [ReactMCP({
    customTools: [
      {
        name: 'log1',
        description: 'Log1',
        schema: z.object({
          message: z.string(),
        }),
        clientFunction: log1,
      }
    ]
  })],
})
```

Then run your app in dev.
> Note: vite-react-mcp is meant to be used in dev environment only

At this point, you already can access `window.__VITE_REACT_MCP_TOOLS__` to use the tools in Developer panel on your browser.

To expose it as an MCP server, setup MCP configuration in your MCP client.

- For Cursor, create a `./cursor/mcp.json` at the root level of your react project.

  ```json
  {
    "mcpServers": {
      "vite-react-mcp": {
        "url": "http://localhost:3000/sse"
      }
    }
  }
  ```

  Make sure the port is the same as your react app

- For Claude Desktop, it requires a bit of workaround. If you are interested, you can take a look at [this thread](https://github.com/orgs/modelcontextprotocol/discussions/16).

  The reason is Claude MCP Client does execution based on command, while what we have here is HTTP based API. You need to write a script acting as a bridge to make it look like execution based.


### How it works

This plugin bridges an MCP server with your React app's runtime, enabling LLMs to inspect and interact with your components in a live browser session. Here's the full picture:

#### Architecture overview

```
MCP Client (Cursor, etc.)
     │
     │  SSE + HTTP POST (/sse, /messages)
     ▼
Vite Dev Server (Node.js)
  ├── MCP Server (handles tool listing & calls)
  └── HMR WebSocket
         │
         │  custom events via Vite HMR
         ▼
      Browser
  ├── overlay.js (tool implementations + WebSocket listeners)
  ├── bippy (React fiber access via __REACT_DEVTOOLS_GLOBAL_HOOK__)
  └── window.__VITE_REACT_MCP_TOOLS__ (tool registry)
```

#### Step by step

1. **Babel AST pass (build time)** — During Vite's `transform` hook, each `.js/.jsx/.ts/.tsx` file is parsed with `@babel/preset-react` to collect all user-defined React component names (function components, class components, `memo`/`forwardRef` wrappers, etc.). These names are stored and later injected into the page as `window.__REACT_COMPONENTS__`.

2. **Browser-side injection (runtime)** — At dev startup, scripts are injected into the HTML `<head>`:
   - The collected component names are set on `window.__REACT_COMPONENTS__`.
   - `overlay.js` is loaded as a module. It uses [bippy](https://github.com/nicholascostadev/bippy) to install a `__REACT_DEVTOOLS_GLOBAL_HOOK__` on `window`, giving direct access to the React fiber tree **without requiring the React DevTools browser extension**. It also hooks into React's commit lifecycle (`onCommitFiberRoot`) to continuously track fiber roots and detect unnecessary re-renders.
   - The overlay exposes all built-in tool functions (highlight, tree, states, re-renders) on `window.__VITE_REACT_MCP_TOOLS__` and registers Vite HMR listeners (`import.meta.hot.on(...)`) for each tool.

3. **MCP server (SSE transport)** — When the Vite dev server starts, the plugin attaches two HTTP endpoints:
   - `GET /sse` — Establishes a long-lived Server-Sent Events connection with the MCP client.
   - `POST /messages?sessionId=<id>` — Receives JSON-RPC tool-call requests from the MCP client.

   The MCP server advertises all built-in and custom tools (with JSON Schema descriptions derived from their Zod schemas) so any MCP-compatible client can discover and invoke them.

4. **Tool call flow** — When an MCP client invokes a tool (e.g. `highlight-component`):
   1. The MCP server receives the JSON-RPC request via the `/messages` endpoint.
   2. It validates the arguments against the tool's Zod schema.
   3. It sends a custom event through Vite's HMR WebSocket to the browser (e.g. `highlight-component` with the serialized args).
   4. The browser-side HMR listener picks up the event, executes the tool function against the live React fiber tree, and sends the result back via another HMR event (e.g. `highlight-component-response`).
   5. The MCP server awaits this response, wraps it in a JSON-RPC result, and streams it back to the MCP client over SSE.

5. **Custom tools** — User-defined tools follow the same WebSocket round-trip. Their handler functions are registered in the browser at startup via dynamic `import()` or inline injection, and corresponding HMR listeners are created automatically.

### Test

```bash
pnpm run playground
```

The playground contains a simple user profile application to test React component interactions.

For e2e automation, Playwright uses a fixed local dev port (`51423`) configured in
[`playground/user-profile-app/vite.config.js`](./playground/user-profile-app/vite.config.js)
and
[`playground/user-profile-app/playwright.config.js`](./playground/user-profile-app/playwright.config.js).

Dependency versions in this package intentionally keep semver ranges for integration libraries (for example `bippy`) and use the workspace lockfile (`pnpm-lock.yaml`) for reproducible installs.

## Acknowledgement

This project is inspired by [vite-plugin-vue-mcp](https://github.com/webfansplz/vite-plugin-vue-mcp). Thanks for the awesome idea bridging mcp and devtools.


## License

MIT

[npm-version-src]: https://img.shields.io/npm/v/vite-react-mcp?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/vite-react-mcp
[npm-downloads-src]: https://img.shields.io/npm/dm/vite-react-mcp?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/vite-react-mcp
