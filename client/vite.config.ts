import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    fs: {
      // Allow serving files from one level up to the project root
      // This is needed to access node_modules outside of client directory
      allow: [
        // By default the current directory is allowed
        path.resolve(__dirname),
        // Allow the parent directory to access node_modules
        path.resolve(__dirname, '../node_modules')
      ],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
