import type { ToolResultValue } from 'vite-react-mcp';

export default function myCustomTool(args: {
  message: string;
}): ToolResultValue {
  const { message } = args;
  const runtime = typeof window === 'undefined' ? 'node' : 'browser';
  if (typeof window !== 'undefined') {
    const targetWindow = window as typeof window & {
      __VITE_REACT_MCP_CUSTOM_TOOL_CALLS__?: string[];
    };
    targetWindow.__VITE_REACT_MCP_CUSTOM_TOOL_CALLS__ = [
      ...(targetWindow.__VITE_REACT_MCP_CUSTOM_TOOL_CALLS__ || []),
      message,
    ];
  }
  console.info(`[custom-tool/log1] ${message}`);
  return {
    success: true,
    message: `Log1 received: ${message}`,
    runtime,
  };
}
