import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import ViteReactMCP from '../../src';

export default defineConfig({
  plugins: [react(), ViteReactMCP()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});