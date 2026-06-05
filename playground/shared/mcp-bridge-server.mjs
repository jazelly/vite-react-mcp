import http from 'node:http';
import {
  RuntimeBridgeServer,
  createStreamableHttpMcpHandler,
  initMcpServer,
} from '@agentic-react/core';

const port = Number(
  process.env.AGENTIC_REACT_SERVER_PORT || 51426,
);
const host = process.env.AGENTIC_REACT_SERVER_HOST || '127.0.0.1';
const rootDir = process.env.AGENTIC_REACT_ROOT_DIR || process.cwd();

const runtimeBridge = new RuntimeBridgeServer();
const handleMcpRequest = createStreamableHttpMcpHandler(() =>
  initMcpServer(runtimeBridge, rootDir, []),
);

const httpServer = http.createServer(async (req, res) => {
  const requestUrl = req.url || '/';
  const requestPath = requestUrl.split('?')[0];

  if (requestPath === '/health') {
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (requestPath === '/mcp') {
    await handleMcpRequest(req, res);
    return;
  }

  res.statusCode = 404;
  res.end('Not Found');
});

runtimeBridge.attach(httpServer);
httpServer.listen(port, host, () => {
  console.log(`[agentic-react] standalone MCP bridge listening on http://${host}:${port}`);
});
