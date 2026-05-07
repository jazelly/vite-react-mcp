import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  use: {
    baseURL: 'http://127.0.0.1:51424',
    permissions: ['clipboard-read', 'clipboard-write'],
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm start',
      cwd: __dirname,
      url: 'http://127.0.0.1:51424',
      timeout: 180000,
      reuseExistingServer: false,
    },
    {
      command:
        'VITE_REACT_MCP_SERVER_PORT=51426 VITE_REACT_MCP_ROOT_DIR=$PWD node ../shared/mcp-bridge-server.mjs',
      cwd: __dirname,
      url: 'http://127.0.0.1:51426/health',
      timeout: 120000,
      reuseExistingServer: false,
    },
  ],
});
