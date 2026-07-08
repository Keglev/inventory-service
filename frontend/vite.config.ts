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

// App version is injected at build time from package.json so the UI can never drift from the manifest.
const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')) as { version: string };

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
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
        // Function form (not object form). The object form let React-family
        // modules (react, react-dom, scheduler, react-is, prop-types,
        // use-sync-external-store) and the shared utils clsx/reselect split
        // across vendor-mui and vendor-charts, which both depend on them. That
        // produced a vendor-charts<->vendor-mui circular chunk and an empty
        // vendor-react chunk. Rollup normalizes ids to forward slashes on every
        // platform, so matching '/node_modules/<pkg>/' is safe on Windows too.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined;
          // React family first: consolidating the shared leaf breaks the cycle
          // and stops react-dom being absorbed into vendor-mui (empty chunk fix).
          if (/\/node_modules\/(react|react-dom|scheduler|react-is|prop-types|use-sync-external-store)\//.test(id))
            return 'vendor-react';
          if (id.includes('/node_modules/@mui/')) return 'vendor-mui';
          // clsx + reselect are the only non-React modules shared by recharts and
          // MUI (x-data-grid); pinning them with recharts removes the reverse
          // vendor-mui->vendor-charts edge.
          if (/\/node_modules\/(recharts|clsx|reselect)\//.test(id)) return 'vendor-charts';
          if (id.includes('/node_modules/react-router')) return 'vendor-routing';
          if (/\/node_modules\/(react-hook-form|@hookform|zod)\//.test(id)) return 'vendor-forms';
          if (/\/node_modules\/(i18next|react-i18next|i18next-browser-languagedetector|i18next-http-backend)\//.test(id))
            return 'vendor-i18n';
          if (/\/node_modules\/(axios|@tanstack|dayjs)\//.test(id)) return 'vendor-utils';
          return undefined;
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
