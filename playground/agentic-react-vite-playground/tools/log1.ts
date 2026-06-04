import type { ToolResultValue } from '@agentic-react/vite';

export default function myCustomTool(args: {
  message: string;
}): ToolResultValue {
  const { message } = args;
  const runtime = typeof window === 'undefined' ? 'node' : 'browser';
  if (typeof window !== 'undefined') {
    const targetWindow = window as typeof window & {
      __AGENTIC_REACT_CUSTOM_TOOL_CALLS__?: string[];
    };
    targetWindow.__AGENTIC_REACT_CUSTOM_TOOL_CALLS__ = [
      ...(targetWindow.__AGENTIC_REACT_CUSTOM_TOOL_CALLS__ || []),
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
