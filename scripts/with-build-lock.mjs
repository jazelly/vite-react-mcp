import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const STALE_LOCK_MS = 10 * 60 * 1000;
const HEARTBEAT_MS = 30 * 1000;
const WAIT_MS = 100;

const command = process.argv[2];
const commandArgs = process.argv.slice(3);

if (!command) {
  console.error('Usage: node scripts/with-build-lock.mjs <command> [...args]');
  process.exit(1);
}

const workspaceKey = Buffer.from(process.cwd()).toString('base64url');
const lockDir = path.join(
  os.tmpdir(),
  `vite-react-mcp-workspace-build-${workspaceKey}.lock`,
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const acquireLock = async () => {
  while (true) {
    try {
      fs.mkdirSync(lockDir);
      fs.writeFileSync(
        path.join(lockDir, 'owner.json'),
        JSON.stringify(
          { pid: process.pid, cwd: process.cwd(), createdAt: Date.now() },
          null,
          2,
        ),
      );
      return;
    } catch (error) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }

      let isStale = false;
      try {
        const stats = fs.statSync(lockDir);
        isStale = Date.now() - stats.mtimeMs > STALE_LOCK_MS;
      } catch (_error) {
        isStale = true;
      }

      if (isStale) {
        fs.rmSync(lockDir, { recursive: true, force: true });
        continue;
      }

      await sleep(WAIT_MS);
    }
  }
};

const releaseLock = () => {
  fs.rmSync(lockDir, { recursive: true, force: true });
};

await acquireLock();

let child;
const heartbeat = setInterval(() => {
  try {
    fs.utimesSync(lockDir, new Date(), new Date());
  } catch (_error) {
    // best effort only
  }
}, HEARTBEAT_MS);

try {
  const forwardSignal = (signal) => {
    if (child && !child.killed) {
      child.kill(signal);
    }
  };
  process.once('SIGINT', () => forwardSignal('SIGINT'));
  process.once('SIGTERM', () => forwardSignal('SIGTERM'));

  child = spawn(command, commandArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  const exitCode = await new Promise((resolve) => {
    child.on('close', resolve);
  });

  process.exitCode = exitCode ?? 1;
} finally {
  clearInterval(heartbeat);
  releaseLock();
}
