[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/jazelly-vite-react-mcp-badge.png)](https://mseep.ai/app/jazelly-vite-react-mcp)

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

```ts
// vite.config.ts
import ReactMCP from 'vite-react-mcp'

export default defineConfig({
  plugins: [ReactMCP()],
})
```

At this point, you already can access `window.__VITE_REACT_MCP_TOOLS__` to use the tools in Developer panel on your browser.

To use it as an MCP server, setup MCP configuration in your MCP client.

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

MCP exposes a tool-call api through natural language. The tool itself is injected on your browser runtime. 
It works without requiring React Devtools extension, as we use `bippy`, which injects a `__REACT_GLOBAL_DEVTOOLS_HOOK__`
to `window`. The tool then is triggered from vite's websocket call to do corresponding actions by receiving mcp tool call 
command from the mcp client you interact.

### Test

```bash
pnpm run playground
```

The playground contains a simple user profile application to test React component interactions.

## Acknowledgement

This project is inspired by [vite-plugin-vue-mcp](https://github.com/webfansplz/vite-plugin-vue-mcp). Thanks for the awesome idea bridging mcp and devtools.


## License

MIT

[npm-version-src]: https://img.shields.io/npm/v/vite-react-mcp?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/vite-react-mcp
[npm-downloads-src]: https://img.shields.io/npm/dm/vite-react-mcp?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/vite-react-mcp
