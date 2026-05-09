import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const host = '127.0.0.1';
const portStateKey = Buffer.from(__dirname).toString('base64url');
const portStatePath = path.join(
  os.tmpdir(),
  `vite-react-mcp-webpack-playground-${portStateKey}.json`,
);
const portLockPath = path.join(
  os.tmpdir(),
  `vite-react-mcp-webpack-playground-${portStateKey}.lock`,
);

const canListen = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });

const findAvailablePort = async (preferredPort) => {
  for (let port = preferredPort; port < preferredPort + 1000; port += 1) {
    if (await canListen(port)) {
      return port;
    }
  }

  throw new Error(
    `Could not find an available Webpack playground port starting at ${preferredPort}.`,
  );
};

const readPortState = () => {
  try {
    const state = JSON.parse(fs.readFileSync(portStatePath, 'utf8'));
    if (Date.now() - state.createdAt < 10 * 60 * 1000) {
      return Number(state.port);
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const writePortState = (port) => {
  fs.mkdirSync(path.dirname(portStatePath), { recursive: true });
  fs.writeFileSync(
    portStatePath,
    JSON.stringify({ createdAt: Date.now(), port }, null, 2),
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForPortState = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const port = readPortState();
    if (port) {
      return port;
    }
    await sleep(100);
  }

  throw new Error('Timed out waiting for Webpack playground port allocation.');
};

const allocatePlaywrightPort = async () => {
  const existingPort = readPortState();
  if (existingPort) {
    return existingPort;
  }

  fs.mkdirSync(path.dirname(portStatePath), { recursive: true });
  let lockHandle;
  try {
    lockHandle = fs.openSync(portLockPath, 'wx');
  } catch (_error) {
    return await waitForPortState();
  }

  try {
    const port = await findAvailablePort(
      Number(process.env.WEBPACK_REACT_PLAYGROUND_PORT || 51425),
    );
    writePortState(port);
    return port;
  } finally {
    fs.closeSync(lockHandle);
    fs.rmSync(portLockPath, { force: true });
  }
};

const playgroundPort = await allocatePlaywrightPort();
process.env.WEBPACK_REACT_PLAYGROUND_PORT = String(playgroundPort);
const playgroundUrl = `http://${host}:${playgroundPort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: playgroundUrl,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm start',
    cwd: __dirname,
    env: {
      ...process.env,
      WEBPACK_REACT_PLAYGROUND_PORT: String(playgroundPort),
    },
    url: playgroundUrl,
    timeout: 180000,
    reuseExistingServer: false,
  },
});
