// Vite configuration for the React frontend.
// Covers local HTTPS (optional cert detection), vendor chunk splitting to improve
// cache efficiency in production, and dev-server proxying to the backend API.

import fs from 'fs';
import path from 'path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const keyPath = path.resolve(__dirname, 'cert/key.pem');
const certPath = path.resolve(__dirname, 'cert/cert.pem');

// Falls back to HTTP if certs are absent; avoids breaking CI or teammates without local certs.
const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);
const httpsConfig = useHttps
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  : undefined;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // MUI's combined bundle exceeds Vite's 500 KB default; raised to suppress noise
    // while keeping the warning active for other chunks.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
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
        // Required when proxying to a different host; prevents the backend from
        // rejecting requests with a mismatched Host header.
        changeOrigin: true,
      },
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev',
    },
    port: 5173,
  },
});
