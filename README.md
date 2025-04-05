# vite-react-mcp

A Vite plugin that creates an MCP server to help LLMs to interact with your React project better

## Features

1. `highlight-component`

`highlight-component`: Highligh a component (input: `componentName`).

![highligh-component](./playground/demo/demo1.gif)

## Getting Started

### Installation

```bash
pnpm install vite-react-mcp -D

```

### Usage

```ts
// vite.config.ts
import ReactMCP from 'vite-react-mcp'

export default defineConfig({
  plugins: [ReactMCP()],
})
```

### Test

```bash
pnpm run playground
```

The playground contains a simple user profile application to test React component interactions.


## License

MIT 