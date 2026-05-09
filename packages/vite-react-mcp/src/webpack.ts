import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { RuntimeBridgeServer } from './bridge/server.js';
import { initMcpServer } from './mcp/index.js';
import type { CustomTool } from './shared/types.js';

interface WebpackEnv {
  mode?: string;
}

export interface ReactMcpWebpackOptions {
  customTools?: CustomTool[];
  rootDir?: string;
}

type WebpackDevServer = {
  server?: unknown;
};

const getClientEntryPath = () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  const currentDirPath = path.dirname(currentFilePath);
  return path.join(currentDirPath, 'next_client_entry.js');
};

const prependWebpackEntry = (
  entryValue: unknown,
  prependPath: string,
): unknown => {
  if (typeof entryValue === 'string') {
    return [prependPath, entryValue];
  }

  if (Array.isArray(entryValue)) {
    return entryValue.includes(prependPath)
      ? entryValue
      : [prependPath, ...entryValue];
  }

  if (entryValue && typeof entryValue === 'object') {
    const entryObject = entryValue as Record<string, unknown>;
    const nextEntryObject: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entryObject)) {
      nextEntryObject[key] = prependWebpackEntry(value, prependPath);
    }
    return nextEntryObject;
  }

  return entryValue;
};

const createMcpMiddlewares = (mcpServer: Server) => {
  const transports = new Map<string, SSEServerTransport>();

  return [
    {
      name: 'vite-react-mcp-sse',
      path: '/sse',
      middleware: async (_req: any, res: any) => {
        const transport = new SSEServerTransport('/messages', res);
        transports.set(transport.sessionId, transport);
        res.on('close', () => {
          transports.delete(transport.sessionId);
        });
        await mcpServer.connect(transport);
      },
    },
    {
      name: 'vite-react-mcp-messages',
      path: '/messages',
      middleware: async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        const query = new URLSearchParams(req.url?.split('?').pop() || '');
        const clientId = query.get('sessionId');

        if (!clientId || typeof clientId !== 'string') {
          res.statusCode = 400;
          res.end('Bad Request');
          return;
        }

        const transport = transports.get(clientId);
        if (!transport) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

        await transport.handlePostMessage(req, res);
      },
    },
  ];
};

export const withReactMcpWebpack = (
  config: Record<string, unknown>,
  env: WebpackEnv = {},
  options: ReactMcpWebpackOptions = {},
) => {
  const isDevelopmentMode = env.mode ? env.mode === 'development' : true;
  if (!isDevelopmentMode) {
    return config;
  }

  const nextConfig = { ...config };
  const entryPath = getClientEntryPath();
  const rootDir =
    options.rootDir ||
    (typeof nextConfig.context === 'string'
      ? nextConfig.context
      : process.cwd());
  const runtimeBridge = new RuntimeBridgeServer();
  const mcpServer = initMcpServer(
    runtimeBridge,
    rootDir,
    options.customTools || [],
  );
  const mcpMiddlewares = createMcpMiddlewares(mcpServer);

  nextConfig.entry = prependWebpackEntry(nextConfig.entry, entryPath);

  const devServer =
    nextConfig.devServer && typeof nextConfig.devServer === 'object'
      ? { ...(nextConfig.devServer as Record<string, any>) }
      : {};
  const existingSetupMiddlewares = devServer.setupMiddlewares;
  const existingOnListening = devServer.onListening;
  let bridgeAttached = false;

  devServer.setupMiddlewares = (
    middlewares: unknown[],
    webpackDevServer: WebpackDevServer,
  ) => {
    const configuredMiddlewares =
      typeof existingSetupMiddlewares === 'function'
        ? existingSetupMiddlewares(middlewares, webpackDevServer)
        : middlewares;

    return [...mcpMiddlewares, ...configuredMiddlewares];
  };

  devServer.onListening = (webpackDevServer: WebpackDevServer) => {
    if (!bridgeAttached && webpackDevServer.server) {
      runtimeBridge.attach(webpackDevServer.server);
      bridgeAttached = true;
    }

    if (typeof existingOnListening === 'function') {
      existingOnListening(webpackDevServer);
    }
  };

  nextConfig.devServer = devServer;
  return nextConfig;
};

export default withReactMcpWebpack;
