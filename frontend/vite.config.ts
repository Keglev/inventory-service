import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
    proxy: {
      '/api': {
        target: 'https://inventoryservice.fly.dev',
        changeOrigin: true,
        secure: true
      },
      '/oauth2': {
        target: 'https://inventoryservice.fly.dev',
        changeOrigin: true,
        secure: true
      },
      '/logout': {
        target: 'https://inventoryservice.fly.dev',
        changeOrigin: true,
        secure: true
      }
    }
  },
  plugins: [react()],
})

