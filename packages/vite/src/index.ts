import { createRequire } from 'node:module';
import path from 'node:path';
import { RuntimeBridgeServer } from '@agentic-react/core/bridge';
import { initMcpServer } from '@agentic-react/core/mcp';
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from '@agentic-react/core/shared/const';
import { generateCustomToolsScript } from '@agentic-react/core/shared/custom-tools-script';
import { BRIDGE_WS_PATH } from '@agentic-react/core/shared/protocol';
import type {
  CustomTool,
  ToolkitConfig,
} from '@agentic-react/core/shared/types';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { type ViteDevServer, normalizePath } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';

const require = createRequire(import.meta.url);

function getAgenticReactCorePath() {
  return normalizePath(
    path.dirname(require.resolve('@agentic-react/core/overlay')),
  );
}

const agenticReactCorePath = getAgenticReactCorePath();
const agenticReactResourceSymbol = '?__agentic-react-resource';
const agenticReactImportee = 'virtual:agentic-react';
const resolvedAgenticReact = `\0${agenticReactImportee}`;

function instrumentViteDevServer(
  viteDevServer: ViteDevServer,
  mcpServer: Server,
) {
  const transports = new Map<string, SSEServerTransport>();

  viteDevServer.middlewares.use('/sse', async (_req, res) => {
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);
    res.on('close', () => {
      transports.delete(transport.sessionId);
    });
    await mcpServer.connect(transport);
  });

  viteDevServer.middlewares.use('/messages', async (req, res) => {
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
  });
}

export interface AgenticReactOptions {
  customTools?: CustomTool[];
  toolkit?: ToolkitConfig;
}

function AgenticReact(options: AgenticReactOptions = {}): Plugin {
  let config: ResolvedConfig;
  const customTools = options.customTools || [];
  const toolkitConfig = options.toolkit || {};

  return {
    name: 'agentic-react',
    enforce: 'pre',
    apply: 'serve',

    configureServer(viteDevServer: ViteDevServer) {
      const runtimeBridge = new RuntimeBridgeServer();
      if (viteDevServer.httpServer) {
        runtimeBridge.attach(viteDevServer.httpServer);
      }

      const mcpServer = initMcpServer(
        runtimeBridge,
        viteDevServer.config.root,
        customTools,
      );
      instrumentViteDevServer(viteDevServer, mcpServer);

      setTimeout(() => {
        console.info(
          'Agentic React MCP server is running on port',
          viteDevServer.config.server.port,
        );
      }, 1000);
    },

    async resolveId(importee) {
      if (importee === agenticReactImportee) {
        return resolvedAgenticReact;
      }
      if (importee.startsWith(`${agenticReactImportee}:`)) {
        const resolved = importee.replace(
          `${agenticReactImportee}:`,
          `${agenticReactCorePath}/`,
        );
        return `${resolved}${agenticReactResourceSymbol}`;
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transformIndexHtml() {
      const registerAgenticReactConfigScript = `
        window.${__AGENTIC_REACT_CONFIG__} = ${JSON.stringify({
          toolkit: toolkitConfig,
          sourceRoot: config.root,
        })};
      `;

      const bridgeUrlScript = `
        (function(){
          var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          window.${__AGENTIC_REACT_BRIDGE_URL__} = protocol + '//' + window.location.host + '${BRIDGE_WS_PATH}';
        })();
      `;

      const customToolsScript = generateCustomToolsScript(
        customTools,
        (specifier) => toClientImportSpecifier(specifier, config),
      );

      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: { type: 'text/javascript' },
          children: registerAgenticReactConfigScript,
        },
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: { type: 'text/javascript' },
          children: bridgeUrlScript,
        },
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: {
            type: 'module',
            src: `${config.base || '/'}@id/${agenticReactImportee}:overlay.js`,
          },
        },
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: { type: 'module' },
          children: customToolsScript,
        },
      ];
    },
  };
}

function toClientImportSpecifier(
  filePathOrSpecifier: string,
  resolvedConfig: ResolvedConfig,
): string {
  const normalized = normalizePath(filePathOrSpecifier);

  if (
    normalized.startsWith('/@fs/') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return normalized;
  }

  if (path.isAbsolute(normalized)) {
    return `/@fs/${normalized}`;
  }

  if (normalized.startsWith('./') || normalized.startsWith('../')) {
    const absolutePath = normalizePath(
      path.resolve(resolvedConfig.root, normalized),
    );
    return `/@fs/${absolutePath}`;
  }

  if (normalized.startsWith('/')) {
    return normalized;
  }

  return `/@id/${normalized}`;
}

export default AgenticReact;
export type {
  AgenticReactConfig,
  CustomClientFunction,
  CustomTool,
  JsonValue,
  SelectionContext,
  SelectionResolvedSource,
  SelectionSourceSnippet,
  SelectionStackFrame,
  ToolkitConfig,
  ToolkitOffset,
  ToolkitPosition,
  ToolResultValue,
} from '@agentic-react/core/shared/types';
