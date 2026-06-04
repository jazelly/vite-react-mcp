import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { RuntimeBridgeServer } from '@agentic-react/core/bridge';
import { initMcpServer } from '@agentic-react/core/mcp';
import {
  __AGENTIC_REACT_BRIDGE_URL__,
  __AGENTIC_REACT_CONFIG__,
} from '@agentic-react/core/shared/const';
import {
  generateCustomToolsScript,
  toBundledClientImportSpecifier,
  toRelativeImportSpecifier,
} from '@agentic-react/core/shared/custom-tools-script';
import { SOURCE_LOOKUP_PATH } from '@agentic-react/core/shared/protocol';
import type {
  CustomTool,
  SelectionResolvedSource,
} from '@agentic-react/core/shared/types';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

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

const require = createRequire(import.meta.url);

const getCoreDistPath = () =>
  path.dirname(require.resolve('@agentic-react/core/overlay'));

const writeWebpackClientEntry = (
  rootDir: string,
  customTools: CustomTool[],
): string => {
  const coreDistPath = getCoreDistPath();
  const generatedDirectory = path.join(rootDir, '.agentic-react-webpack');
  const generatedEntryPath = path.join(generatedDirectory, 'client-entry.mjs');
  const constSpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(coreDistPath, 'shared/const.js'),
  );
  const protocolSpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(coreDistPath, 'shared/protocol.js'),
  );
  const overlaySpecifier = toRelativeImportSpecifier(
    generatedDirectory,
    path.join(coreDistPath, 'overlay.js'),
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

const LOCAL_COMPONENT_NAME_PATTERN = /^[A-Z][A-Za-z0-9_$]*$/;

const stripCssEscapes = (value: string): string =>
  value.replace(/\\([^\r\n])/g, '$1');

const pushSourceHint = (hints: string[], hint: string | null | undefined) => {
  if (!hint || hint.length < 3 || hints.includes(hint)) return;
  hints.push(hint);
};

const extractSelectorHints = (selector: string): string[] => {
  const hints: string[] = [];
  const idMatch = selector.match(/#((?:\\.|[^\s>+~.#:[\]])+)/);
  pushSourceHint(hints, idMatch?.[1] ? stripCssEscapes(idMatch[1]) : null);

  const classHints = Array.from(
    selector.matchAll(/\.((?:\\.|[^\s>+~.#:[\]])+)/g),
    (match) => stripCssEscapes(match[1]),
  );
  for (const classHint of classHints.reverse()) {
    pushSourceHint(hints, classHint);
  }

  return hints;
};

const isSourceFileName = (fileName: string): boolean =>
  /\.(?:jsx?|tsx?)$/i.test(fileName);

const walkProjectSourceFiles = (
  directory: string,
  visit: (filePath: string) => boolean,
): boolean => {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (_error) {
    return false;
  }

  for (const entry of entries) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.git' ||
      entry.name === 'dist' ||
      entry.name === 'tmp'
    ) {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (walkProjectSourceFiles(entryPath, visit)) return true;
      continue;
    }

    if (!isSourceFileName(entry.name)) continue;
    if (visit(entryPath)) return true;
  }

  return false;
};

const findComponentSourceInProject = (
  rootDir: string,
  componentName: string,
  selector: string,
): SelectionResolvedSource | null => {
  if (!LOCAL_COMPONENT_NAME_PATTERN.test(componentName)) return null;

  const declarationPattern = new RegExp(
    `(?:function\\s+${componentName}\\b|const\\s+${componentName}\\s*=|class\\s+${componentName}\\b)`,
  );
  const hints = extractSelectorHints(selector);
  const normalizedRootDir = fs.realpathSync(rootDir);
  let matchedSource: SelectionResolvedSource | null = null;

  walkProjectSourceFiles(rootDir, (filePath) => {
    let sourceText: string;
    try {
      sourceText = fs.readFileSync(filePath, 'utf8');
    } catch (_error) {
      return false;
    }

    if (!declarationPattern.test(sourceText)) return false;

    const lines = sourceText.split(/\r?\n/);
    const declarationIndex = lines.findIndex((line) =>
      declarationPattern.test(line),
    );
    let lineIndex = declarationIndex >= 0 ? declarationIndex : 0;
    const searchStartIndex = Math.max(0, lineIndex);
    const searchRanges = [
      lines.slice(searchStartIndex).map((line, index) => ({
        line,
        lineIndex: searchStartIndex + index,
      })),
      lines.slice(0, searchStartIndex).map((line, index) => ({
        line,
        lineIndex: index,
      })),
    ];

    for (const hint of hints) {
      for (const searchRange of searchRanges) {
        const matchedLine = searchRange.find(({ line }) => line.includes(hint));
        if (matchedLine) {
          lineIndex = matchedLine.lineIndex;
          break;
        }
      }
      if (lineIndex !== declarationIndex) break;
    }

    matchedSource = {
      filePath: path
        .relative(normalizedRootDir, fs.realpathSync(filePath))
        .replace(/\\/g, '/'),
      lineNumber: lineIndex + 1,
      columnNumber: null,
      componentName,
    };
    return true;
  });

  return matchedSource;
};

const createSourceLookupMiddleware = (rootDir: string) => ({
  name: 'agentic-react-source-lookup',
  path: SOURCE_LOOKUP_PATH,
  middleware: (req: any, res: any) => {
    if (req.method !== 'GET') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const requestUrl = new URL(
      req.url || SOURCE_LOOKUP_PATH,
      'http://127.0.0.1',
    );
    const componentName = requestUrl.searchParams.get('component') || '';
    const selector = requestUrl.searchParams.get('selector') || '';
    const source = findComponentSourceInProject(
      rootDir,
      componentName,
      selector,
    );

    if (!source) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(source));
  },
});

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
  const mcpMiddlewares = [
    createSourceLookupMiddleware(rootDir),
    ...createMcpMiddlewares(mcpServer),
  ];

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
