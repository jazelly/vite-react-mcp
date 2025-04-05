import type { ViteDevServer } from 'vite';
import { z } from 'zod';
import { version } from '../../package.json';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import zodToJsonSchema from 'zod-to-json-schema';
import { HighlightComponentSchema } from './schema.js';

export function initMcpServer(viteDevServer: ViteDevServer): Server {
  const server = new Server(
    {
      name: 'vite-react-mcp',
      version,
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
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
