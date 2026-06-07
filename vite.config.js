import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'public',          // Tells Vite to output directly to the backend public folder
    emptyOutDir: true,         // Wipes old build files before rewriting clean files
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      // Routes local development api calls cleanly to your Termux backend
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});


