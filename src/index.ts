import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePath, type ViteDevServer } from 'vite';
import type { Plugin } from 'vite';
import { initMcpServer, instrumentViteDevServer } from './mcp';

function getViteReactMcpPath() {
  const pluginPath = normalizePath(
    path.dirname(fileURLToPath(import.meta.url)),
  );
  return pluginPath.replace(/\/dist$/, '//src');
}

const viteReactMcpPath = getViteReactMcpPath();
const viteReactMcpResourceSymbol = '?__vite-react-mcp-resource';
const viteReactMcpImportee = 'virtual:vite-react-mcp';
const resolvedViteReactMcp = `\0${viteReactMcpImportee}`;

function ReactMCP(): Plugin {
  return {
    name: 'vite-react-mcp',
    enforce: 'pre',
    apply: 'serve',

    configureServer(viteDevServer: ViteDevServer) {
      const mcpServer = initMcpServer(viteDevServer);
      instrumentViteDevServer(viteDevServer, mcpServer);

      console.info('vite dev server port', viteDevServer.config.server.port);
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

    transformIndexHtml() {
      return [
        {
          tag: 'script',
          injectTo: 'head-prepend',
          attrs: {
            type: 'module',
            src: `/@id/${viteReactMcpImportee}:core/overlay.js`,
          },
        },
      ];
    },
  };
}

export default ReactMCP;
