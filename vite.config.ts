import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode !== 'test' ? [tailwindcss()] : []),
  ],
  resolve: {
    alias: {
      '@wagmi/core/tempo': path.resolve(__dirname, './src/shims/tempo.ts'),
    },
  },
}));
