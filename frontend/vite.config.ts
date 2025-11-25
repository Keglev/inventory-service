/**
 * @file vitest.config.ts
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const keyPath = path.resolve(__dirname, 'cert/key.pem');
const certPath = path.resolve(__dirname, 'cert/cert.pem');

const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);
const httpsConfig = useHttps
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  : undefined;

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 800, // Set to 800KB to allow MUI chunk but warn for others
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material', '@mui/x-data-grid'],
          'vendor-routing': ['react-router-dom'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-charts': ['recharts'],
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
          'vendor-utils': ['axios', '@tanstack/react-query', 'dayjs'],
        },
      },
    },
  },
  server: {
    https: httpsConfig,
    proxy: {
      '/api': {
        target: 'https://inventoryservice.fly.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev',
    },
    port: 5173,
  },
  plugins: [react()],
});
