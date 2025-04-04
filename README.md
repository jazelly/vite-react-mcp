# React MCP for Vite 

A Vite plugin that creates an MCP server to help LLMs to interact with your React project better

## Features

1. `highlight-react-component`


## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- pnpm (v10.6.5 or newer)

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Playground App

```bash
pnpm run playground
```

The playground contains a user profile application to test React components.


## Cautions

It hijacks `__REACT_DEVTOOLS_GLOBAL_HOOK__` to hack into react internals. Not recommended to use this on production.

## License

MIT 