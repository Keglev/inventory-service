import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': 'https://inventoryservice.fly.dev',
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev'
    }
  },
  plugins: [react()],
});
