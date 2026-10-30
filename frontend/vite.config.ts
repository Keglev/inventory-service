/**
 * @file vite.config.ts
 * @module vite.config
 *
 * @summary
 * Vite configuration for the React frontend: optional local HTTPS (certificate
 * detection), vendor chunk splitting, and dev-server proxying to a local
 * backend.
 *
 * @enterprise
 * Vendor chunks change less often than application code, so splitting them keeps
 * the browser cache warm across releases; the proxy keeps local work off the
 * production API.
 */

import fs from 'fs';
import path from 'path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const keyPath = path.resolve(import.meta.dirname, 'cert/key.pem');
const certPath = path.resolve(import.meta.dirname, 'cert/cert.pem');

// Falls back to HTTP if certs are absent; avoids breaking CI or teammates without local certs.
const useHttps = fs.existsSync(keyPath) && fs.existsSync(certPath);
const httpsConfig = useHttps
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  : undefined;

// The dev server and `vite preview` proxy to a local backend (port 8081, as in
// application.yml), so local work never sends traffic to production.
// DEV_PROXY_TARGET overrides it from the shell, .env, .env.local or
// .env.development; without a VITE_ prefix it never reaches the bundle.
const proxyTarget = loadEnv('development', import.meta.dirname, '').DEV_PROXY_TARGET || 'http://localhost:8081';

// App version is injected at build time from package.json so the UI can never drift from the manifest.
const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf-8')) as { version: string };

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    // MUI's combined bundle exceeds Vite's 500 KB default; raised to suppress noise
    // while keeping the warning active for other chunks.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Rolldown groups replace Rollup's manualChunks (deprecated in Vite 8,
        // and under Rolldown it put all of @mui/material into vendor-grid). A
        // group also takes the dependencies of what it captures, highest
        // priority first, so the order below decides where a shared module
        // lands. Ids use forward slashes on every platform.
        codeSplitting: {
          groups: [
            // React family first: one copy, shared by every other vendor chunk.
            {
              name: 'vendor-react',
              priority: 9,
              test: /\/node_modules\/(react|react-dom|scheduler|react-is|prop-types|use-sync-external-store)\//,
            },
            // clsx and reselect are shared by recharts and MUI; pinning them with
            // recharts keeps the edges one-way (mui -> charts), with no cycle.
            { name: 'vendor-charts', priority: 8, test: /\/node_modules\/(recharts|clsx|reselect)\// },
            // The data grid (@mui/x-*) is half of all MUI code: on its own it
            // keeps both chunks below the 800 kB warning (FQ2). Material goes
            // first, or the grid group would take it in as a dependency.
            { name: 'vendor-mui', priority: 7, test: /\/node_modules\/@mui\/(?!x-)/ },
            { name: 'vendor-grid', priority: 6, test: /\/node_modules\/@mui\/x-/ },
            { name: 'vendor-routing', priority: 5, test: /\/node_modules\/react-router/ },
            { name: 'vendor-forms', priority: 4, test: /\/node_modules\/(react-hook-form|@hookform|zod)\// },
            {
              name: 'vendor-i18n',
              priority: 3,
              test: /\/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector|i18next-http-backend)\//,
            },
            { name: 'vendor-utils', priority: 2, test: /\/node_modules\/(axios|@tanstack)\// },
          ],
        },
      },
    },
  },
  server: {
    https: httpsConfig,
    proxy: {
      '/api': {
        target: proxyTarget,
        // Required when proxying to a different host; prevents the backend from
        // rejecting requests with a mismatched Host header.
        changeOrigin: true,
      },
      '/oauth2': proxyTarget,
      '/logout': proxyTarget,
    },
    port: 5173,
  },
});
