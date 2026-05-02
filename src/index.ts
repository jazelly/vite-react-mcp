import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as babel from '@babel/core';
import { createFilter } from '@rollup/pluginutils';
import { type ViteDevServer, normalizePath } from 'vite';
import type { Plugin, ResolvedConfig } from 'vite';
import { RuntimeBridgeServer } from './bridge/server.js';
import { createBabelDisplayNamePlugin } from './babel_collect_name.js';
import { initMcpServer, instrumentViteDevServer } from './mcp/index.js';
import {
  __VITE_REACT_MCP_BRIDGE_URL__,
  __VITE_REACT_MCP_CONFIG__,
} from './shared/const.js';
import { BRIDGE_WS_PATH } from './shared/protocol.js';
import { store } from './shared/store.js';
import type { CustomTool, ToolkitConfig } from './shared/types.js';

function getViteReactMcpPath() {
  const pluginPath = normalizePath(
    path.dirname(fileURLToPath(import.meta.url)),
  );
  return pluginPath;
}

const viteReactMcpPath = getViteReactMcpPath();
const viteReactMcpResourceSymbol = '?__vite-react-mcp-resource';
const viteReactMcpImportee = 'virtual:vite-react-mcp';
const resolvedViteReactMcp = `\0${viteReactMcpImportee}`;

function readProjectConfig(configPath: string): {
  include: string[];
  exclude: string[];
} {
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      let include = config.include || [];
      const exclude = config.exclude || [];

      include = include.map((pattern) => {
        if (!pattern.includes('*')) {
          return pattern.endsWith('/')
            ? `${pattern}**/*.{js,jsx,ts,tsx}`
            : `${pattern}/**/*.{js,jsx,ts,tsx}`;
        }
        return pattern;
      });

      if (!exclude.some((pattern) => pattern.includes('node_modules'))) {
        exclude.push('**/node_modules/**');
      }

      return { include, exclude };
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.warn(`Failed to read config from ${configPath}:`, error.message);
    } else {
      console.warn(`Failed to read config from ${configPath}:`, error);
    }
  }

  return {
    include: ['src/**/*.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**'],
  };
}

export interface ReactMCPOptions {
  customTools?: CustomTool[];
  toolkit?: ToolkitConfig;
}

function ReactMCP(options: ReactMCPOptions = {}): Plugin {
  const configPatterns = readProjectConfig('tsconfig.json');
  const filter = createFilter(configPatterns.include, configPatterns.exclude);

  function transformBabelCollectName(code: string, id: string) {
    if (!filter(id) || !/\.[jt]sx?$/.test(id)) {
      return null;
    }

    try {
      let presetReact = false;
      try {
        const presetReactPath = path.resolve(
          'node_modules/@babel/preset-react',
        );
        if (fs.existsSync(presetReactPath)) {
          presetReact = true;
        }
      } catch (_e) {
        console.warn(
          '\n[vite-plugin-display-name-suffix] Warning: @babel/preset-react is not installed.',
        );
      }

      const babelOptions: babel.TransformOptions = {
        babelrc: false,
        configFile: false,
        filename: id,
        presets: [],
        plugins: [[createBabelDisplayNamePlugin()]],
        ast: true,
        sourceType: 'module',
      };

      if (presetReact) {
        babelOptions.presets.push([
          '@babel/preset-react',
          { runtime: 'automatic' },
        ]);
      }

      const result = babel.transformSync(code, babelOptions);

      return {
        code: result?.code || code,
        map: result?.map || null,
      };
    } catch (error) {
      console.error(`Error transforming ${id}:`, error);
      return null;
    }
  }

  let config: ResolvedConfig;
  const customTools = options.customTools || [];
  const toolkitConfig = options.toolkit || {};

  return {
    name: 'vite-react-mcp',
    enforce: 'pre',
    apply: 'serve',

    configureServer(viteDevServer: ViteDevServer) {
      const runtimeBridge = new RuntimeBridgeServer();
      if (viteDevServer.httpServer) {
        runtimeBridge.attach(viteDevServer.httpServer);
      }

      const mcpServer = initMcpServer(runtimeBridge, viteDevServer.config.root, customTools);
      instrumentViteDevServer(viteDevServer, mcpServer);

      setTimeout(() => {
        console.info(
          'Vite React MCP server is running on port',
          viteDevServer.config.server.port,
        );
      }, 1000);
    },

    async resolveId(importee) {
      if (importee === viteReactMcpImportee) {
        return resolvedViteReactMcp;
      }
      if (importee.startsWith(`${viteReactMcpImportee}:`)) {
        const resolved = importee.replace(
          `${viteReactMcpImportee}:`,
          `${viteReactMcpPath}/`,
        );
        return `${resolved}${viteReactMcpResourceSymbol}`;
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    transform(code, id) {
      return transformBabelCollectName(code, id);
    },

    transformIndexHtml() {
      const componentsArray = Array.from(store.SELF_REACT_COMPONENTS);

      const registerComponentsScript = `
        window.__REACT_COMPONENTS__ = ${JSON.stringify(componentsArray)};
      `;
      const registerViteReactMcpConfigScript = `
        window.${__VITE_REACT_MCP_CONFIG__} = ${JSON.stringify({
          toolkit: toolkitConfig,
          sourceRoot: config.root,
        })};
      `;

      const bridgeUrlScript = `
        (function(){
          var protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          window.${__VITE_REACT_MCP_BRIDGE_URL__} = protocol + '//' + window.location.host + '${BRIDGE_WS_PATH}';
        })();
      `;

      const customToolsScript = generateCustomToolsScript(customTools, config);

      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: { type: 'text/javascript' },
          children: registerComponentsScript,
        },
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: { type: 'text/javascript' },
          children: registerViteReactMcpConfigScript,
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
            src: `${config.base || '/'}@id/${viteReactMcpImportee}:overlay.js`,
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

function generateCustomToolsScript(
  customTools: CustomTool[],
  resolvedConfig: ResolvedConfig,
): string {
  const toolRegistrations = customTools
    .map((tool) => {
      const safeToolName = JSON.stringify(tool.name);
      if (typeof tool.clientFunction === 'function') {
        const functionSource = tool.clientFunction.toString();
        if (functionSource.includes('[native code]')) {
          return `
            console.error('[vite-react-mcp] Unable to register custom tool ${tool.name}: native functions are not supported as clientFunction');
          `;
        }
        return `
          registerTool(${safeToolName}, (${functionSource}));
        `;
      }

      const importSpecifier = toClientImportSpecifier(
        tool.clientFunction,
        resolvedConfig,
      );
      const safeSpecifier = JSON.stringify(importSpecifier);
      return `
        import(${safeSpecifier})
          .then((module) => {
            const handler = module.default ?? module;
            registerTool(${safeToolName}, handler);
          })
          .catch((error) => {
            console.error('[vite-react-mcp] Failed to load custom tool ${tool.name}:', error);
          });
      `;
    })
    .join('\n');

  return `
    const registerTool = (name, handler) => {
      const tryRegister = (attempt = 0) => {
        const registry = window.__VITE_REACT_MCP_TOOLS__;
        if (registry?.registerCustomTool) {
          registry.registerCustomTool(name, handler);
          return;
        }
        if (attempt >= 40) {
          console.warn('[vite-react-mcp] Custom tool registration timed out for', name);
          return;
        }
        setTimeout(() => tryRegister(attempt + 1), 50);
      };

      tryRegister();
    };

    ${toolRegistrations}
  `;
}

export default ReactMCP;
export type {
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
  ViteReactMcpConfig,
} from './shared/types.js';
