import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import ReactMCP from 'vite-react-mcp';
import { z } from 'zod';
import log1 from './tools/log1.js';

export default defineConfig({
  plugins: [react(), ReactMCP({
    customTools: [
      {
        name: 'log1',
        description: 'Log1',
        schema: z.object({
          message: z.string(),
        }),
        clientFunction: log1,
      }
    ]
  })],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});
