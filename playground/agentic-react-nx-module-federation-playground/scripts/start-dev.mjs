import { spawn } from 'node:child_process';

const projects = [
  ['catalog', process.env.NX_MF_CATALOG_PORT || '4201'],
  ['profile', process.env.NX_MF_PROFILE_PORT || '4202'],
  ['shell', process.env.NX_MF_SHELL_PORT || '4200'],
];

const children = projects.map(([project, port]) =>
  spawn('pnpm', ['exec', 'nx', 'run', `${project}:serve`, `--port=${port}`], {
    env: process.env,
    stdio: 'inherit',
  }),
);

const stopChildren = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
};

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    stopChildren();
    process.exit(0);
  });
}

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (code === 0 || signal === 'SIGTERM') {
      return;
    }

    stopChildren();
    process.exit(code || 1);
  });
}
