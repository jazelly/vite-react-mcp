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
    name: 'agentic-react-vite-playground',
    cwd: path.join(rootDir, 'playground/agentic-react-vite-playground'),
    command: ['pnpm', ['run', 'e2e', ...playwrightArgs]],
  },
  {
    name: 'agentic-react-webpack-playground',
    cwd: path.join(rootDir, 'playground/agentic-react-webpack-playground'),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
  {
    name: 'agentic-react-next-playground',
    cwd: path.join(rootDir, 'playground/agentic-react-next-playground'),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
  {
    name: 'agentic-react-nx-module-federation-playground',
    cwd: path.join(
      rootDir,
      'playground/agentic-react-nx-module-federation-playground',
    ),
    command: [
      'pnpm',
      ['exec', 'env', '-u', 'NO_COLOR', 'playwright', 'test', ...playwrightArgs],
    ],
  },
];

await run('pnpm', ['run', 'build'], rootDir);

for (const suite of suites) {
  const [command, args] = suite.command;
  console.info(`\n[agentic-react] running ${suite.name}`);
  await run(command, args, suite.cwd);
}
