import type { ViteDevServer } from 'vite';
import { z } from 'zod';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import zodToJsonSchema from 'zod-to-json-schema';
import { GetComponentTreeSchema, HighlightComponentSchema } from './schema.js';
import { getVersionString, waitForEvent } from '../shared/node_util.js';

export function initMcpServer(viteDevServer: ViteDevServer): Server {
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
    return {
      tools: [
        {
          name: 'highlight-component',
          description: 'Highlight React component based on the component name.',
          inputSchema: zodToJsonSchema(HighlightComponentSchema),
        },
        {
          name: 'get-component-tree',
          description: 'Get a tree-like representation of the component tree of the current page.',
          inputSchema: zodToJsonSchema(GetComponentTreeSchema),
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    try {
      switch (request.params.name) {
        case 'highlight-component': {
          const args = HighlightComponentSchema.parse(request.params.arguments);
          viteDevServer.ws.send({
            type: 'custom',
            event: 'highlight-component',
            data: JSON.stringify(args),
          });
          return {
            content: [{ type: 'text', text: 'Highlighting component...' }],
          };
        }

        case 'get-component-tree': {
          const args = GetComponentTreeSchema.parse(request.params.arguments);
          viteDevServer.ws.send({
            type: 'custom', 
            event: 'get-component-tree',
            data: JSON.stringify(args),
          });

          const response = await waitForEvent<string>(viteDevServer, 'get-component-tree-response');
          return {
            content: [{ type: 'text', text: response.data }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid input: ${JSON.stringify(error.errors)}`);
      }
      throw error;
    }
  });

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
