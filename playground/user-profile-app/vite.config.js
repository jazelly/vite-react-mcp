import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import ReactMCP from 'vite-react-mcp';

export default defineConfig({
  plugins: [react(), ReactMCP()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
});