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
  server: {
    https: httpsConfig, // Now it's either undefined or a proper object
    proxy: {
      '/api': 'https://inventoryservice.fly.dev',
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev',
    },
    port: 5173,
  },
  plugins: [react()],
});
