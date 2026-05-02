import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:51425',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm start',
    cwd: __dirname,
    port: 51425,
    timeout: 120000,
    reuseExistingServer: false,
  },
});
