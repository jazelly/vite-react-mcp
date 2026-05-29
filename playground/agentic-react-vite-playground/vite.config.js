import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import AgenticReact from '@jazelly/agentic-react';
import { z } from 'zod';
import log1 from './tools/log1.js';

export default defineConfig({
  plugins: [
    react(),
    AgenticReact({
      customTools: [
        {
          name: 'log1',
          description: 'Log1',
          schema: z.object({
            message: z.string(),
          }),
          clientFunction: log1,
        },
      ],
      toolkit: {
        iconUrl: '/agentic-react-logo.png',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 51423,
  },
});
