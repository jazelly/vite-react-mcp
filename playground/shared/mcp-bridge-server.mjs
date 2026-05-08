import http from 'node:http';
import { URLSearchParams } from 'node:url';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { RuntimeBridgeServer, initMcpServer } from 'react-mcp';

const port = Number(process.env.VITE_REACT_MCP_SERVER_PORT || 51426);
const host = process.env.VITE_REACT_MCP_SERVER_HOST || '127.0.0.1';
const rootDir = process.env.VITE_REACT_MCP_ROOT_DIR || process.cwd();

const runtimeBridge = new RuntimeBridgeServer();
const mcpServer = initMcpServer(runtimeBridge, rootDir, []);
const transports = new Map();

const httpServer = http.createServer(async (req, res) => {
  const requestUrl = req.url || '/';
  const requestPath = requestUrl.split('?')[0];

  if (requestPath === '/health') {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (requestPath === '/sse') {
    const transport = new SSEServerTransport('/messages', res);
    transports.set(transport.sessionId, transport);
    res.on('close', () => {
      transports.delete(transport.sessionId);
    });
    await mcpServer.connect(transport);
    return;
  }

  if (requestPath === '/messages') {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end('Method Not Allowed');
      return;
    }

    const query = new URLSearchParams(requestUrl.split('?')[1] || '');
    const sessionId = query.get('sessionId');
    if (!sessionId) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    const transport = transports.get(sessionId);
    if (!transport) {
      res.statusCode = 404;
      res.end('Not Found');
      return;
    }

    await transport.handlePostMessage(req, res);
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

runtimeBridge.attach(httpServer);
httpServer.listen(port, host, () => {
  console.log(`[vite-react-mcp] standalone MCP bridge listening on http://${host}:${port}`);
});
