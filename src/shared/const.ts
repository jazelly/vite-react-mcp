export const __VITE_REACT_MCP_TOOLS__ = '__VITE_REACT_MCP_TOOLS__';

export const target = (
  typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
      ? globalThis
      : {}
) as typeof globalThis;
