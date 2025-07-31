import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

/**
 * Vite configuration for Smart Supply Pro frontend.
 *
 * This setup:
 * - Proxies all backend requests to Fly.io backend service
 * - Ensures cookies (e.g., JSESSIONID) are preserved for authentication
 * - Supports development and production login sessions via OAuth2
 */
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./cert/key.pem'),
      cert: fs.readFileSync('./cert/cert.pem'),
    },
    proxy: {
      '/api': 'https://inventoryservice.fly.dev',
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev',
    }
  },
  plugins: [react()],
})

