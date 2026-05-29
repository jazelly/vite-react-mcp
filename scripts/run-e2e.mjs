import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), '..');
const playwrightArgs = process.argv.slice(2).filter((arg) => arg !== '--');

const run = (command, args, cwd) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (exitCode) => {
      if (exitCode === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(' ')} failed with exit code ${exitCode}`,
        ),
      );
    });
  });

const suites = [
  {
    name: 'vite-react-app',
    cwd: path.join(rootDir, 'playground/vite-react-app'),
    command: ['pnpm', ['run', 'e2e', ...playwrightArgs]],
  },
  {
    name: 'webpack-react-playground',
    cwd: path.join(rootDir, 'playground/webpack-react-app'),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
  {
    name: 'next-app-playground',
    cwd: path.join(rootDir, 'playground/next-app'),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
  {
    name: 'nx-module-federation-react-playground',
    cwd: path.join(rootDir, 'playground/nx-module-federation-monorepo'),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
];

await run('pnpm', ['run', 'build'], rootDir);

for (const suite of suites) {
  const [command, args] = suite.command;
  console.info(`\n[vite-react-mcp] running ${suite.name}`);
  await run(command, args, suite.cwd);
}
