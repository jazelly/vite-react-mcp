import path from 'node:path';
import type { CustomTool } from './types.js';

export type ClientImportSpecifierResolver = (
  filePathOrSpecifier: string,
) => string;

export const toRelativeImportSpecifier = (
  fromDirectory: string,
  filePath: string,
): string => {
  const relativePath = path
    .relative(fromDirectory, filePath)
    .replace(/\\/g, '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

export const toBundledClientImportSpecifier = (
  rootDir: string,
  fromDirectory: string,
  filePathOrSpecifier: string,
): string => {
  const normalized = filePathOrSpecifier.trim().replace(/\\/g, '/');

  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(normalized)
  ) {
    return normalized;
  }

  if (path.isAbsolute(normalized)) {
    return toRelativeImportSpecifier(fromDirectory, normalized);
  }

  if (normalized.startsWith('./') || normalized.startsWith('../')) {
    return toRelativeImportSpecifier(
      fromDirectory,
      path.resolve(rootDir, normalized),
    );
  }

  if (normalized.startsWith('/')) {
    return toRelativeImportSpecifier(
      fromDirectory,
      path.resolve(rootDir, `.${normalized}`),
    );
  }

  return normalized;
};

export function generateCustomToolsScript(
  customTools: CustomTool[],
  resolveClientImportSpecifier: ClientImportSpecifierResolver,
): string {
  const toolRegistrations = customTools
    .map((tool) => {
      const safeToolName = JSON.stringify(tool.name);
      if (typeof tool.clientFunction === 'function') {
        const functionSource = tool.clientFunction.toString();
        if (functionSource.includes('[native code]')) {
          return `
            console.error('[vite-react-mcp] Unable to register custom tool', ${safeToolName}, ': native functions are not supported as clientFunction');
          `;
        }
        return `
          registerTool(${safeToolName}, (${functionSource}));
        `;
      }

      const importSpecifier = resolveClientImportSpecifier(tool.clientFunction);
      const safeSpecifier = JSON.stringify(importSpecifier);
      return `
        import(${safeSpecifier})
          .then((module) => {
            const handler = module.default ?? module;
            registerTool(${safeToolName}, handler);
          })
          .catch((error) => {
            console.error('[vite-react-mcp] Failed to load custom tool', ${safeToolName}, ':', error);
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
