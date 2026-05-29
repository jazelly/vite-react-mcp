import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { RuntimeBridgeServer } from './bridge/server.js';
import { initMcpServer } from './mcp/index.js';
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from './shared/const.js';
import {
  generateCustomToolsScript,
  toBundledClientImportSpecifier,
  toRelativeImportSpecifier,
} from './shared/custom_tools_script.js';
import type { CustomTool } from './shared/types.js';

interface WebpackEnv {
  mode?: string;
}

export interface AgenticReactWebpackOptions {
  customTools?: CustomTool[];
  rootDir?: string;
}

type WebpackDevServer = {
  server?: unknown;
};

const getPackageDistPath = () => {
  const currentFilePath = fileURLToPath(import.meta.url);
  return path.dirname(currentFilePath);
};

const writeWebpackClientEntry = (
  rootDir: string,
  customTools: CustomTool[],
): string => {
  const packageDistPath = getPackageDistPath();
  const generatedDirectory = path.join(rootDir, '.agentic-react-webpack');
  const generatedEntryPath = path.join(generatedDirectory, 'client-entry.mjs');
  const constSpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(packageDistPath, 'shared/const.js'),
  );
  const protocolSpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(packageDistPath, 'shared/protocol.js'),
  );
  const overlaySpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(packageDistPath, 'overlay.js'),
  );
  const customToolsScript = generateCustomToolsScript(
    customTools,
    (specifier) =>
      toBundledClientImportSpecifier(rootDir, generatedDirectory, specifier),
  );

  const entrySource = `
import {
  ${__AGENTIC_REACT_BRIDGE_URL__},
  ${__AGENTIC_REACT_CONFIG__},
} from ${JSON.stringify(constSpecifier)};
import { BRIDGE_WS_PATH } from ${JSON.stringify(protocolSpecifier)};

if (typeof window !== 'undefined') {
  if (!window[${__AGENTIC_REACT_CONFIG__}]) {
    window[${__AGENTIC_REACT_CONFIG__}] = {
      sourceRoot: ${JSON.stringify(rootDir)},
    };
  }

  if (!window[${__AGENTIC_REACT_BRIDGE_URL__}]) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    window[${__AGENTIC_REACT_BRIDGE_URL__}] =
      \`\${protocol}//\${window.location.host}\${BRIDGE_WS_PATH}\`;
  }
}

void import(${JSON.stringify(overlaySpecifier)});

${customToolsScript}
`;

  fs.mkdirSync(generatedDirectory, { recursive: true });
  if (
    !fs.existsSync(generatedEntryPath) ||
    fs.readFileSync(generatedEntryPath, 'utf8') !== entrySource
  ) {
    fs.writeFileSync(generatedEntryPath, entrySource);
  }

  return generatedEntryPath;
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
      name: 'agentic-react-sse',
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
      name: 'agentic-react-messages',
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

export const withAgenticReactWebpack = (
  config: Record<string, unknown>,
  env: WebpackEnv = {},
  options: AgenticReactWebpackOptions = {},
) => {
  const isDevelopmentMode = env.mode ? env.mode === 'development' : true;
  if (!isDevelopmentMode) {
    return config;
  }

  const nextConfig = { ...config };
  const rootDir =
    options.rootDir ||
    (typeof nextConfig.context === 'string'
      ? nextConfig.context
      : process.cwd());
  const entryPath = writeWebpackClientEntry(rootDir, options.customTools || []);
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

export default withAgenticReactWebpack;
