import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type ViteDevServer, normalizePath } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';
import { RuntimeBridgeServer } from './bridge/server.js';
import { initMcpServer, instrumentViteDevServer } from './mcp/index.js';
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from './shared/const.js';
import { generateCustomToolsScript } from './shared/custom_tools_script.js';
import { BRIDGE_WS_PATH } from './shared/protocol.js';
import type { CustomTool, ToolkitConfig } from './shared/types.js';

function getAgenticReactPath() {
  const pluginPath = normalizePath(
    path.dirname(fileURLToPath(import.meta.url)),
  );
  return pluginPath;
}

const agenticReactPath = getAgenticReactPath();
const agenticReactResourceSymbol = '?__agentic-react-resource';
const agenticReactImportee = 'virtual:agentic-react';
const resolvedAgenticReact = `\0${agenticReactImportee}`;

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
          `${agenticReactPath}/`,
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
} from './shared/types.js';
