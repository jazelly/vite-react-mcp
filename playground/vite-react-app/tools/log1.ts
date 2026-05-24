import type { ToolResultValue } from 'vite-react-mcp';

export default function myCustomTool(args: {
  message: string;
}): ToolResultValue {
  const { message } = args;
  console.info(`[custom-tool/log1] ${message}`);
  return {
    success: true,
    message: `Log1 received: ${message}`,
  };
}
