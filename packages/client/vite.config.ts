import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@scrabble/common': path.resolve(__dirname, '../common/src/index.ts'),
      '@scrabble/game': path.resolve(__dirname, '../game/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
});
