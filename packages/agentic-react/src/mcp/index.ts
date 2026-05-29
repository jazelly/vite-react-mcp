import fs from 'node:fs';
import path from 'node:path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  type CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ViteDevServer } from 'vite';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { getVersionString } from '../shared/node_util.js';
import type { BridgeRequestEvent } from '../shared/protocol.js';
import {
  buildSelectionContextSummary,
  buildSelectionSourcePreview,
} from '../shared/selection_context_format.js';
import {
  classifySourcePath,
  isAllowedProjectSourcePath,
  normalizeSourceRoot,
} from '../shared/source_path.js';
import type {
  CustomTool,
  SelectionContext,
  SelectionResolvedSource,
  SelectionSourceSnippet,
  ToolResultValue,
} from '../shared/types.js';
import {
  CopyLastSelectionContextSchema,
  GetComponentStatesSchema,
  GetComponentTreeSchema,
  GetHtmlElementsSchema,
  GetLastSelectionContextSchema,
  GetReactSourceCodeSchema,
  GetUnnecessaryRerendersSchema,
  HighlightComponentSchema,
  SetSelectionModeSchema,
} from './schema.js';

const builtInTools = [
  {
    name: 'highlight-component',
    description: 'Highlight React component based on the component name.',
    inputSchema: zodToJsonSchema(HighlightComponentSchema),
  },
  {
    name: 'get-component-tree',
    description:
      'Get the React component tree of the current page in ASCII format.',
    inputSchema: zodToJsonSchema(GetComponentTreeSchema),
  },
  {
    name: 'get-component-states',
    description:
      'Get the React component props, states, and contexts in JSON structure format.',
    inputSchema: zodToJsonSchema(GetComponentStatesSchema),
  },
  {
    name: 'get-unnecessary-rerenders',
    description: 'Get the wasted re-rendered components of the current page',
    inputSchema: zodToJsonSchema(GetUnnecessaryRerendersSchema),
  },
  {
    name: 'set-selection-mode',
    description:
      'Enable or disable browser element selection mode for context capture.',
    inputSchema: zodToJsonSchema(SetSelectionModeSchema),
  },
  {
    name: 'get-last-selection-context',
    description:
      'Get the latest captured selection context, optionally enriched with source snippets from the project filesystem.',
    inputSchema: zodToJsonSchema(GetLastSelectionContextSchema),
  },
  {
    name: 'copy-last-selection-context',
    description:
      'Copy the latest captured selection context from the browser runtime into clipboard.',
    inputSchema: zodToJsonSchema(CopyLastSelectionContextSchema),
  },
  {
    name: 'get-html-elements',
    description:
      'Find matching HTML elements by search strings and return deterministic candidates.',
    inputSchema: zodToJsonSchema(GetHtmlElementsSchema),
  },
  {
    name: 'get-react-source-code',
    description:
      'Find matching elements using search strings and return deterministic React source context for the best candidate.',
    inputSchema: zodToJsonSchema(GetReactSourceCodeSchema),
  },
] as const;

type BuiltInToolName = (typeof builtInTools)[number]['name'];

const builtInToolNames = new Set(builtInTools.map((tool) => tool.name));

function isBuiltInToolName(name: string): name is BuiltInToolName {
  return builtInToolNames.has(name as BuiltInToolName);
}

function formatToolResult(result: ToolResultValue): string {
  if (typeof result === 'string') {
    return result;
  }
  if (result === undefined) {
    return 'Custom tool executed successfully.';
  }
  try {
    return JSON.stringify(result);
  } catch (_error) {
    return String(result);
  }
}

const toTextResponse = (data: unknown): CallToolResult => {
  return {
    content: [{ type: 'text', text: JSON.stringify(data) }],
  };
};

const resolveAbsoluteSourcePath = (
  rootDir: string,
  filePath: string,
): string | null => {
  const normalizedRootDir = fs.realpathSync(rootDir);
  const normalizedSourceRoot = normalizeSourceRoot(
    normalizedRootDir.replace(/\\/g, '/'),
  );

  if (!isAllowedProjectSourcePath(filePath, normalizedSourceRoot)) {
    return null;
  }

  const classifiedPath = classifySourcePath(filePath, normalizedSourceRoot);
  const candidates: string[] = [];

  if (classifiedPath.kind === 'vite-fs') {
    const fileSystemPath = classifiedPath.normalizedPath.slice('/@fs'.length);
    candidates.push(path.resolve(fileSystemPath));
  } else if (classifiedPath.kind === 'fs-absolute') {
    candidates.push(path.resolve(classifiedPath.normalizedPath));
  } else if (classifiedPath.kind === 'vite-root-relative') {
    candidates.push(path.resolve(rootDir, `.${classifiedPath.normalizedPath}`));
  } else if (classifiedPath.kind === 'project-relative') {
    candidates.push(path.resolve(rootDir, classifiedPath.normalizedPath));

    const nxWebpackSourcePathMatch = classifiedPath.normalizedPath.match(
      /^([^/]+)\/(?:\.\/)?src\/(.+)$/,
    );
    if (nxWebpackSourcePathMatch) {
      const [, projectName, sourcePath] = nxWebpackSourcePathMatch;
      candidates.push(
        path.resolve(rootDir, 'apps', projectName, 'src', sourcePath),
      );
    }
  }

  for (const candidate of candidates) {
    const resolvedCandidate = path.resolve(candidate);
    if (!fs.existsSync(resolvedCandidate)) {
      continue;
    }

    const stat = fs.statSync(resolvedCandidate);
    if (!stat.isFile()) {
      continue;
    }

    const realCandidate = fs.realpathSync(resolvedCandidate);
    const relativeToRoot = path.relative(normalizedRootDir, realCandidate);
    const isInsideRoot =
      relativeToRoot === '' ||
      (!relativeToRoot.startsWith('..') && !path.isAbsolute(relativeToRoot));
    if (!isInsideRoot) {
      continue;
    }

    const pathSegments = relativeToRoot.split(path.sep);
    if (
      pathSegments.includes('node_modules') ||
      pathSegments.includes('.vite')
    ) {
      continue;
    }

    return realCandidate;
  }

  return null;
};

const getSourceSnippet = (
  filePath: string,
  lineNumber: number | null,
  contextLines: number,
): SelectionSourceSnippet | null => {
  try {
    const rawFileContent = fs.readFileSync(filePath, 'utf8');
    const fileLines = rawFileContent.split(/\r?\n/);
    const referenceLine = Math.max(
      1,
      Math.min(fileLines.length, lineNumber || 1),
    );
    const startLine = Math.max(1, referenceLine - contextLines);
    const endLine = Math.min(fileLines.length, referenceLine + contextLines);

    const snippet = fileLines
      .slice(startLine - 1, endLine)
      .map((lineContent, index) => {
        const absoluteLine = startLine + index;
        return `${absoluteLine}: ${lineContent}`;
      })
      .join('\n');

    return {
      filePath,
      startLine,
      endLine,
      snippet,
    };
  } catch (_error) {
    return null;
  }
};

const LOCAL_COMPONENT_NAME_PATTERN = /^[A-Z][A-Za-z0-9_$]*$/;
const IGNORED_LOCAL_USAGE_COMPONENTS = new Set([
  'Button',
  'Card',
  'Card2',
  'CardBody',
  'CardBody2',
  'ChakraComponent2',
  'HStack',
  'VStack',
  'Box',
  'Flex',
  'Stack',
  'Text',
  'Heading',
  'RenderedRoute',
]);

const isExternalPath = (filePath: string | null): boolean =>
  Boolean(
    filePath &&
      (filePath.includes('/node_modules/') ||
        filePath.includes('node_modules/') ||
        filePath.includes('/.vite/') ||
        filePath.includes('/@vite/')),
  );

const inferLocalUsageComponentName = (
  selectionContext: SelectionContext,
): string | null => {
  for (const stackFrame of selectionContext.stackFrames) {
    const componentName = stackFrame.functionName;
    if (!componentName || !LOCAL_COMPONENT_NAME_PATTERN.test(componentName)) {
      continue;
    }
    if (IGNORED_LOCAL_USAGE_COMPONENTS.has(componentName)) {
      continue;
    }
    if (isExternalPath(stackFrame.fileName)) {
      continue;
    }
    return componentName;
  }

  return null;
};

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
      if (walkProjectSourceFiles(entryPath, visit)) {
        return true;
      }
      continue;
    }

    if (!/\.(?:jsx?|tsx?)$/i.test(entry.name)) {
      continue;
    }

    if (visit(entryPath)) {
      return true;
    }
  }

  return false;
};

const findComponentSourceInProject = (
  rootDir: string,
  componentName: string,
): SelectionResolvedSource | null => {
  const declarationPattern = new RegExp(
    `(?:function\\s+${componentName}\\b|const\\s+${componentName}\\s*=|class\\s+${componentName}\\b)`,
  );
  let matchedSource: SelectionResolvedSource | null = null;
  const normalizedRootDir = fs.realpathSync(rootDir);

  walkProjectSourceFiles(rootDir, (filePath) => {
    let sourceText: string;
    try {
      sourceText = fs.readFileSync(filePath, 'utf8');
    } catch (_error) {
      return false;
    }

    if (!declarationPattern.test(sourceText)) {
      return false;
    }

    const lines = sourceText.split(/\r?\n/);
    const matchIndex = lines.findIndex((line) => declarationPattern.test(line));
    const realFilePath = fs.realpathSync(filePath);
    const relativeFilePath = path
      .relative(normalizedRootDir, realFilePath)
      .replace(/\\/g, '/');

    matchedSource = {
      filePath: relativeFilePath,
      lineNumber: matchIndex >= 0 ? matchIndex + 1 : 1,
      columnNumber: null,
      componentName,
    };
    return true;
  });

  return matchedSource;
};

const stripCssEscapes = (value: string): string =>
  value.replace(/\\([^\r\n])/g, '$1');

const pushSourceHint = (hints: string[], hint: string | null | undefined) => {
  if (!hint || hint.length < 3) {
    return;
  }
  if (hints.includes(hint)) {
    return;
  }
  hints.push(hint);
};

const extractSelectionSourceHints = (
  selectionContext: SelectionContext,
): string[] => {
  const hints: string[] = [];
  const selector = selectionContext.selector ?? '';
  const idMatch = selector.match(/#((?:\\.|[^\s>+~.#:[\]])+)/);
  if (idMatch?.[1]) {
    pushSourceHint(hints, stripCssEscapes(idMatch[1]));
  }

  for (const attrMatch of selector.matchAll(
    /\[[^\]=\s]+=(?:"([^"]*)"|'([^']*)'|([^\]\s]+))\]/g,
  )) {
    pushSourceHint(
      hints,
      stripCssEscapes(attrMatch[1] ?? attrMatch[2] ?? attrMatch[3]),
    );
  }

  const domPreview = selectionContext.domPreview;
  for (const attrName of [
    'id',
    'data-testid',
    'data-test-id',
    'data-test',
    'data-cy',
    'data-qa',
    'aria-label',
    'name',
    'title',
  ]) {
    const attrPattern = new RegExp(`${attrName}=["']([^"']+)["']`, 'i');
    const attrMatch = domPreview.match(attrPattern);
    pushSourceHint(hints, attrMatch?.[1]);
  }

  return hints;
};

const refineLocalUsageSourceLine = (
  rootDir: string,
  selectionContext: SelectionContext,
  localUsageSource: SelectionResolvedSource,
): SelectionResolvedSource => {
  const hints = extractSelectionSourceHints(selectionContext);
  if (hints.length === 0) {
    return localUsageSource;
  }

  const absoluteSourcePath = resolveAbsoluteSourcePath(
    rootDir,
    localUsageSource.filePath,
  );
  if (!absoluteSourcePath) {
    return localUsageSource;
  }

  let sourceText: string;
  try {
    sourceText = fs.readFileSync(absoluteSourcePath, 'utf8');
  } catch (_error) {
    return localUsageSource;
  }

  const sourceLines = sourceText.split(/\r?\n/);
  const searchStartIndex = Math.max(0, (localUsageSource.lineNumber ?? 1) - 1);
  const searchRanges = [
    sourceLines.slice(searchStartIndex).map((line, index) => ({
      line,
      lineIndex: searchStartIndex + index,
    })),
    sourceLines.slice(0, searchStartIndex).map((line, lineIndex) => ({
      line,
      lineIndex,
    })),
  ];

  for (const hint of hints) {
    for (const searchRange of searchRanges) {
      const matchedLine = searchRange.find(({ line }) => line.includes(hint));
      if (matchedLine) {
        return {
          ...localUsageSource,
          lineNumber: matchedLine.lineIndex + 1,
        };
      }
    }
  }

  return localUsageSource;
};

const placeResolvedSourceFirst = (
  resolvedSources: SelectionResolvedSource[],
  preferredSource: SelectionResolvedSource,
): SelectionResolvedSource[] => [
  preferredSource,
  ...resolvedSources.filter(
    (source) =>
      source.filePath !== preferredSource.filePath ||
      source.componentName !== preferredSource.componentName,
  ),
];

const enrichExternalComponentUsage = (
  rootDir: string,
  selectionContext: SelectionContext,
): SelectionContext => {
  if (!selectionContext.externalComponent) {
    return selectionContext;
  }

  const localUsageSource =
    selectionContext.externalComponent.usedBy ??
    (() => {
      const localUsageComponentName =
        inferLocalUsageComponentName(selectionContext);
      if (!localUsageComponentName) {
        return null;
      }
      return findComponentSourceInProject(rootDir, localUsageComponentName);
    })();
  if (!localUsageSource) {
    return selectionContext;
  }

  const refinedLocalUsageSource = refineLocalUsageSourceLine(
    rootDir,
    selectionContext,
    localUsageSource,
  );
  const nextResolvedSources = placeResolvedSourceFirst(
    selectionContext.resolvedSources,
    refinedLocalUsageSource,
  );

  const nextSelectionContext = {
    ...selectionContext,
    externalComponent: {
      ...selectionContext.externalComponent,
      usedBy: refinedLocalUsageSource,
    },
    resolvedSources: nextResolvedSources,
  };

  return {
    ...nextSelectionContext,
    sourcePreview: buildSelectionSourcePreview(nextSelectionContext),
  };
};

const enrichSelectionContextWithSnippets = (
  rootDir: string,
  selectionContext: SelectionContext,
  contextLines: number,
  maxFiles: number,
): SelectionContext => {
  const enrichedSelectionContext = enrichExternalComponentUsage(
    rootDir,
    selectionContext,
  );
  const sourceSnippets: SelectionSourceSnippet[] = [];
  const seenFilePaths = new Set<string>();

  for (const resolvedSource of enrichedSelectionContext.resolvedSources) {
    const sourceFilePath = resolvedSource.filePath;
    if (!sourceFilePath || seenFilePaths.has(sourceFilePath)) {
      continue;
    }

    if (sourceSnippets.length >= maxFiles) {
      break;
    }

    const absoluteSourcePath = resolveAbsoluteSourcePath(
      rootDir,
      sourceFilePath,
    );
    if (!absoluteSourcePath) {
      continue;
    }

    const sourceSnippet = getSourceSnippet(
      absoluteSourcePath,
      resolvedSource.lineNumber,
      contextLines,
    );

    if (!sourceSnippet) {
      continue;
    }

    sourceSnippets.push({
      ...sourceSnippet,
      filePath: sourceFilePath,
    });
    seenFilePaths.add(sourceFilePath);
  }

  return {
    ...enrichedSelectionContext,
    sourceSnippets,
    sourcePreview: buildSelectionSourcePreview({
      ...enrichedSelectionContext,
      sourceSnippets,
    }),
  };
};

const parseSelectionContextResponse = (response: {
  context: SelectionContext | null;
}): SelectionContext | null => {
  if (!response || !response.context) {
    return null;
  }

  return {
    ...response.context,
    externalComponent: response.context.externalComponent ?? null,
    sourcePreview: response.context.sourcePreview ?? null,
    sourceSnippets: Array.isArray(response.context.sourceSnippets)
      ? response.context.sourceSnippets
      : [],
  };
};

export interface McpRuntimeBridge {
  request: (event: BridgeRequestEvent, payload: unknown) => Promise<unknown>;
}

const requestRuntime = async <T>(
  bridge: McpRuntimeBridge,
  event: BridgeRequestEvent,
  args: unknown,
): Promise<T> => {
  const response = await bridge.request(event, args);
  return response as T;
};

export function initMcpServer(
  bridge: McpRuntimeBridge,
  rootDir: string,
  customTools: CustomTool[] = [],
): Server {
  const server = new Server(
    {
      name: 'agentic-react',
      version: getVersionString(),
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const dynamicTools = customTools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: zodToJsonSchema(tool.schema),
    }));

    return {
      tools: [...builtInTools, ...dynamicTools],
    };
  });

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request): Promise<CallToolResult> => {
      try {
        if (isBuiltInToolName(request.params.name)) {
          switch (request.params.name) {
            case 'highlight-component': {
              const args = HighlightComponentSchema.parse(
                request.params.arguments,
              );
              const response = await requestRuntime<string>(
                bridge,
                'highlight-component',
                args,
              );
              return {
                content: [{ type: 'text', text: response }],
              };
            }

            case 'get-component-tree': {
              const args = GetComponentTreeSchema.parse(
                request.params.arguments,
              );
              const response = await requestRuntime<string>(
                bridge,
                'get-component-tree',
                args,
              );
              return {
                content: [{ type: 'text', text: response }],
              };
            }

            case 'get-component-states': {
              const args = GetComponentStatesSchema.parse(
                request.params.arguments,
              );
              const response = await requestRuntime<string>(
                bridge,
                'get-component-states',
                args,
              );
              return {
                content: [{ type: 'text', text: response }],
              };
            }

            case 'get-unnecessary-rerenders': {
              const args = GetUnnecessaryRerendersSchema.parse(
                request.params.arguments,
              );

              const response = await requestRuntime<string>(
                bridge,
                'get-unnecessary-rerenders',
                args,
              );
              return {
                content: [{ type: 'text', text: response }],
              };
            }

            case 'set-selection-mode': {
              const args = SetSelectionModeSchema.parse(
                request.params.arguments,
              );
              const response = await requestRuntime<{
                success: boolean;
                enabled: boolean;
              }>(bridge, 'set-selection-mode', args);

              return toTextResponse(response);
            }

            case 'get-last-selection-context': {
              const args = GetLastSelectionContextSchema.parse(
                request.params.arguments,
              );

              const browserResponse = await requestRuntime<{
                context: SelectionContext | null;
              }>(bridge, 'get-last-selection-context', args);

              const selectionContext =
                parseSelectionContextResponse(browserResponse);
              if (!selectionContext) {
                return toTextResponse({
                  success: false,
                  message: 'No selection context has been captured yet.',
                  context: null,
                });
              }

              const enrichedSelectionContext = args.includeSourceSnippets
                ? enrichSelectionContextWithSnippets(
                    rootDir,
                    selectionContext,
                    args.contextLines,
                    args.maxFiles,
                  )
                : enrichExternalComponentUsage(rootDir, selectionContext);

              return toTextResponse({
                success: true,
                summary: buildSelectionContextSummary(enrichedSelectionContext),
                context: enrichedSelectionContext,
              });
            }

            case 'copy-last-selection-context': {
              const args = CopyLastSelectionContextSchema.parse(
                request.params.arguments,
              );

              const response = await requestRuntime<{
                success: boolean;
                copied: boolean;
                format: 'text' | 'json';
                context?: SelectionContext;
                error?: string;
              }>(bridge, 'copy-last-selection-context', args);

              return toTextResponse(response);
            }

            case 'get-html-elements': {
              const args = GetHtmlElementsSchema.parse(
                request.params.arguments,
              );
              const response = await requestRuntime<unknown>(
                bridge,
                'get-html-elements',
                args,
              );
              return toTextResponse(response);
            }

            case 'get-react-source-code': {
              const args = GetReactSourceCodeSchema.parse(
                request.params.arguments,
              );
              const response = (await requestRuntime<{
                success: boolean;
                reason?: string;
                chosenMatch?: {
                  selector: string | null;
                  query: string;
                };
                context?: SelectionContext | null;
              }>(bridge, 'get-react-source-code', args)) || {
                success: false,
              };

              if (!response.success || !response.context) {
                return toTextResponse(response);
              }

              const enrichedContext = args.includeSourceSnippets
                ? enrichSelectionContextWithSnippets(
                    rootDir,
                    response.context,
                    args.contextLines,
                    args.maxFiles,
                  )
                : enrichExternalComponentUsage(rootDir, response.context);

              return toTextResponse({
                success: true,
                chosenMatch: response.chosenMatch,
                summary: buildSelectionContextSummary(enrichedContext),
                context: enrichedContext,
              });
            }

            default:
              throw new Error(`Unknown tool: ${request.params.name}`);
          }
        }

        const customTool = customTools.find(
          (tool) => tool.name === request.params.name,
        );
        if (customTool) {
          const parsedArgs = customTool.schema.parse(request.params.arguments);
          const result = await requestRuntime<ToolResultValue>(
            bridge,
            'custom-tool',
            {
              args: parsedArgs,
              name: customTool.name,
            },
          );
          return {
            content: [{ type: 'text', text: formatToolResult(result) }],
          };
        }

        throw new Error(`Unknown tool: ${request.params.name}`);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
        }
        throw error;
      }
    },
  );

  return server;
}

export function instrumentViteDevServer(
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
