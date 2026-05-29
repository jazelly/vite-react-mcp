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
  `agentic-react-nx-mf-playground-${portStateKey}.json`,
);
const portLockPath = path.join(
  os.tmpdir(),
  `agentic-react-nx-mf-playground-${portStateKey}.lock`,
);

const canListen = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.listen(port, host, () => {
      server.close(() => resolve(true));
    });
  });

const findAvailablePort = async (preferredPort, reservedPorts) => {
  for (let port = preferredPort; port < preferredPort + 1000; port += 1) {
    if (reservedPorts.has(port)) {
      continue;
    }

    if (await canListen(port)) {
      reservedPorts.add(port);
      return port;
    }
  }

  throw new Error(
    `Could not find an available Nx module federation playground port starting at ${preferredPort}.`,
  );
};

const readPortState = () => {
  try {
    const state = JSON.parse(fs.readFileSync(portStatePath, 'utf8'));
    if (Date.now() - state.createdAt < 10 * 60 * 1000) {
      return {
        catalogPort: Number(state.catalogPort),
        profilePort: Number(state.profilePort),
        shellPort: Number(state.shellPort),
      };
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const writePortState = ({ catalogPort, profilePort, shellPort }) => {
  fs.mkdirSync(path.dirname(portStatePath), { recursive: true });
  fs.writeFileSync(
    portStatePath,
    JSON.stringify(
      { catalogPort, createdAt: Date.now(), profilePort, shellPort },
      null,
      2,
    ),
  );
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForPortState = async () => {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const ports = readPortState();
    if (ports) {
      return ports;
    }
    await sleep(100);
  }

  throw new Error(
    'Timed out waiting for Nx module federation playground port allocation.',
  );
};

const allocatePorts = async () => {
  const reservedPorts = new Set();
  const shellPort = await findAvailablePort(
    Number(process.env.NX_MF_SHELL_PORT || 4200),
    reservedPorts,
  );
  const catalogPort = await findAvailablePort(
    Number(process.env.NX_MF_CATALOG_PORT || 4201),
    reservedPorts,
  );
  const profilePort = await findAvailablePort(
    Number(process.env.NX_MF_PROFILE_PORT || 4202),
    reservedPorts,
  );

  return { catalogPort, profilePort, shellPort };
};

const allocatePlaywrightPorts = async () => {
  const existingPorts = readPortState();
  if (existingPorts) {
    return existingPorts;
  }

  fs.mkdirSync(path.dirname(portStatePath), { recursive: true });
  let lockHandle;
  try {
    lockHandle = fs.openSync(portLockPath, 'wx');
  } catch (_error) {
    return await waitForPortState();
  }

  try {
    const ports = await allocatePorts();
    writePortState(ports);
    return ports;
  } finally {
    fs.closeSync(lockHandle);
    fs.rmSync(portLockPath, { force: true });
  }
};

const ports = await allocatePlaywrightPorts();
const { catalogPort, profilePort, shellPort } = ports;

process.env.NX_MF_SHELL_PORT = String(shellPort);
process.env.NX_MF_CATALOG_PORT = String(catalogPort);
process.env.NX_MF_PROFILE_PORT = String(profilePort);
const shellUrl = `http://${host}:${shellPort}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: shellUrl,
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm start',
    cwd: __dirname,
    env: {
      ...process.env,
      NX_MF_CATALOG_PORT: String(catalogPort),
      NX_MF_PROFILE_PORT: String(profilePort),
      NX_MF_SHELL_PORT: String(shellPort),
    },
    url: shellUrl,
    timeout: 240000,
    reuseExistingServer: false,
  },
});
