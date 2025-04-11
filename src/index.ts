import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { normalizePath, type ViteDevServer } from 'vite';
import type { Plugin } from 'vite';
import { initMcpServer, instrumentViteDevServer } from './mcp/index.js';
import { createFilter } from '@rollup/pluginutils';
import * as babel from '@babel/core';
import { store } from './shared/store.js';
import { createBabelDisplayNamePlugin } from './inject_name.js';

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

/**
 * Read include/exclude patterns from tsconfig.json or other config files
 * @param {string} configPath Path to config file
 * @returns {Object} Object with include and exclude arrays
 */
function readProjectConfig(configPath: string): { include: string[], exclude: string[] } {
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configContent);

      // Extract include/exclude patterns
      let include = config.include || [];
      let exclude = config.exclude || [];

      // Convert to glob patterns if needed
      include = include.map((pattern) => {
        // Convert directory patterns to include all supported file types
        if (!pattern.includes('*')) {
          return pattern.endsWith('/')
            ? `${pattern}**/*.{js,jsx,ts,tsx}`
            : `${pattern}/**/*.{js,jsx,ts,tsx}`;
        }
        return pattern;
      });

      // Add node_modules to exclude if not already present
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

  // Default fallback patterns
  return {
    include: ['src/**/*.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**'],
  };
}


function ReactMCP(): Plugin {
  const configPatterns = readProjectConfig('tsconfig.json');
  const filter = createFilter(configPatterns.include, configPatterns.exclude);

  return {
    name: 'vite-react-mcp',
    enforce: 'pre',
    apply: 'serve',

    configureServer(viteDevServer: ViteDevServer) {
      const mcpServer = initMcpServer(viteDevServer);
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

    // inject a displayName suffix to all self-defined components
    transform(code, id) {
      // Only process JS/JSX/TS/TSX files that match our filter
      if (!filter(id) || !/\.[jt]sx?$/.test(id)) {
        return null;
      }

      // Extract filename for component naming
      const filename = path.basename(id, path.extname(id));

      try {
        // Try to dynamically import @babel/preset-react
        let presetReact;
        try {
          // In ESM we can't use require, so we can check if the package is installed
          // by importing it dynamically or checking if it exists in node_modules
          const presetReactPath = path.resolve(
            'node_modules/@babel/preset-react',
          );
          if (fs.existsSync(presetReactPath)) {
            // If it exists, we'll let Babel use it through its name
            presetReact = true;
          }
        } catch (e) {
          // Log warning but continue - the developer's project might have its own JSX handling
          console.warn(
            '\n[vite-plugin-display-name-suffix] Warning: @babel/preset-react is not installed.',
          );
          console.warn(
            'If you encounter JSX parsing errors, install it with: npm install @babel/preset-react --save-dev\n',
          );
        }

        // Configure Babel transformation
        const babelOptions: babel.TransformOptions = {
          babelrc: false,
          configFile: false,
          filename: id,
          presets: [],
          plugins: [
            // Plugin to add displayName to React components
            [createBabelDisplayNamePlugin()],
          ],
          ast: true,
          sourceType: 'module',
        };

        // Add preset-react if available
        if (presetReact) {
          babelOptions.presets.push([
            '@babel/preset-react',
            { runtime: 'automatic' },
          ]);
        }

        // Transform the code using Babel
        const result = babel.transformSync(code, babelOptions);

        return {
          code: result.code,
          map: result.map,
        };
      } catch (error) {
        console.error(`Error transforming ${id}:`, error);
        return null;
      }
    },

    transformIndexHtml() {
      // Convert the Set to an Array for serialization
      const componentsArray = Array.from(store.SELF_REACT_COMPONENTS);
      
      // Create the script to register components to window
      const registerComponentsScript = `
        window.__REACT_COMPONENTS__ = ${JSON.stringify(componentsArray)};
      `;
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
