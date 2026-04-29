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
import { getVersionString, waitForEvent } from '../shared/node_util.js';
import type {
  CustomTool,
  SelectionContext,
  SelectionSourceSnippet,
  ToolResultValue,
} from '../shared/types.js';
import {
  CopyLastSelectionContextSchema,
  GetComponentStatesSchema,
  GetComponentTreeSchema,
  GetLastSelectionContextSchema,
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

const sendBrowserEventAndWait = async <T>(
  viteDevServer: ViteDevServer,
  event: string,
  responseEvent: string,
  args: unknown,
): Promise<T> => {
  viteDevServer.ws.send({
    type: 'custom',
    event,
    data: JSON.stringify(args),
  });

  const response = await waitForEvent<string>(viteDevServer, responseEvent);
  return JSON.parse(response.data) as T;
};

const resolveAbsoluteSourcePath = (
  rootDir: string,
  filePath: string,
): string | null => {
  const trimmedPath = filePath.trim();
  if (!trimmedPath) return null;

  const candidates: string[] = [];

  if (path.isAbsolute(trimmedPath)) {
    candidates.push(trimmedPath);
  }

  candidates.push(path.resolve(rootDir, trimmedPath));

  if (trimmedPath.startsWith('/')) {
    candidates.push(path.resolve(rootDir, `.${trimmedPath}`));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
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

const enrichSelectionContextWithSnippets = (
  rootDir: string,
  selectionContext: SelectionContext,
  contextLines: number,
  maxFiles: number,
): SelectionContext => {
  const sourceSnippets: SelectionSourceSnippet[] = [];
  const seenFilePaths = new Set<string>();

  for (const resolvedSource of selectionContext.resolvedSources) {
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
    ...selectionContext,
    sourceSnippets,
  };
};

const buildSelectionContextSummary = (
  selectionContext: SelectionContext,
): string => {
  const summaryLines: string[] = [];
  summaryLines.push(selectionContext.domPreview);

  if (selectionContext.componentName) {
    summaryLines.push(`component: ${selectionContext.componentName}`);
  }

  if (selectionContext.selector) {
    summaryLines.push(`selector: ${selectionContext.selector}`);
  }

  if (selectionContext.resolvedSources.length > 0) {
    summaryLines.push('resolved sources:');
    for (const resolvedSource of selectionContext.resolvedSources) {
      const line =
        resolvedSource.lineNumber != null
          ? `:${resolvedSource.lineNumber}`
          : '';
      const column =
        resolvedSource.columnNumber != null
          ? `:${resolvedSource.columnNumber}`
          : '';
      summaryLines.push(`- ${resolvedSource.filePath}${line}${column}`);
    }
  }

  return summaryLines.join('\n');
};

const parseSelectionContextResponse = (response: {
  context: SelectionContext | null;
}): SelectionContext | null => {
  if (!response || !response.context) {
    return null;
  }

  return {
    ...response.context,
    sourceSnippets: Array.isArray(response.context.sourceSnippets)
      ? response.context.sourceSnippets
      : [],
  };
};

export function initMcpServer(
  viteDevServer: ViteDevServer,
  customTools: CustomTool[] = [],
): Server {
  const server = new Server(
    {
      name: 'vite-react-mcp',
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
              viteDevServer.ws.send({
                type: 'custom',
                event: 'highlight-component',
                data: JSON.stringify(args),
              });

              const response = await waitForEvent<string>(
                viteDevServer,
                'highlight-component-response',
              );
              return {
                content: [{ type: 'text', text: response.data }],
              };
            }

            case 'get-component-tree': {
              const args = GetComponentTreeSchema.parse(
                request.params.arguments,
              );
              viteDevServer.ws.send({
                type: 'custom',
                event: 'get-component-tree',
                data: JSON.stringify(args),
              });

              const response = await waitForEvent<string>(
                viteDevServer,
                'get-component-tree-response',
              );
              return {
                content: [{ type: 'text', text: response.data }],
              };
            }

            case 'get-component-states': {
              const args = GetComponentStatesSchema.parse(
                request.params.arguments,
              );
              viteDevServer.ws.send({
                type: 'custom',
                event: 'get-component-states',
                data: JSON.stringify(args),
              });

              const response = await waitForEvent<string>(
                viteDevServer,
                'get-component-states-response',
              );
              return {
                content: [{ type: 'text', text: response.data }],
              };
            }

            case 'get-unnecessary-rerenders': {
              const args = GetUnnecessaryRerendersSchema.parse(
                request.params.arguments,
              );

              viteDevServer.ws.send({
                type: 'custom',
                event: 'get-unnecessary-rerenders',
                data: JSON.stringify(args),
              });

              const response = await waitForEvent<string>(
                viteDevServer,
                'get-unnecessary-rerenders-response',
              );
              return {
                content: [{ type: 'text', text: response.data }],
              };
            }

            case 'set-selection-mode': {
              const args = SetSelectionModeSchema.parse(
                request.params.arguments,
              );
              const response = await sendBrowserEventAndWait<{
                success: boolean;
                enabled: boolean;
              }>(
                viteDevServer,
                'set-selection-mode',
                'set-selection-mode-response',
                args,
              );

              return toTextResponse(response);
            }

            case 'get-last-selection-context': {
              const args = GetLastSelectionContextSchema.parse(
                request.params.arguments,
              );

              const browserResponse = await sendBrowserEventAndWait<{
                context: SelectionContext | null;
              }>(
                viteDevServer,
                'get-last-selection-context',
                'get-last-selection-context-response',
                args,
              );

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
                    viteDevServer.config.root,
                    selectionContext,
                    args.contextLines,
                    args.maxFiles,
                  )
                : selectionContext;

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

              const response = await sendBrowserEventAndWait<{
                success: boolean;
                copied: boolean;
                format: 'text' | 'json';
                context?: SelectionContext;
                error?: string;
              }>(
                viteDevServer,
                'copy-last-selection-context',
                'copy-last-selection-context-response',
                args,
              );

              return toTextResponse(response);
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

          if (typeof customTool.clientFunction !== 'function') {
            throw new Error(
              `Custom tool "${customTool.name}" must provide a function clientFunction for MCP execution.`,
            );
          }

          const result = await customTool.clientFunction(parsedArgs);
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
