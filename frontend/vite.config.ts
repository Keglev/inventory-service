import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const keyPath = path.resolve(__dirname, 'cert/key.pem')
const certPath = path.resolve(__dirname, 'cert/cert.pem')

// Conditionally define HTTPS options only if cert files exist
let httpsConfig: undefined | { key: Buffer; cert: Buffer } = undefined

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  httpsConfig = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  }
}

export default defineConfig({
  server: {
    https: httpsConfig, // Either undefined or valid ServerOptions object
    proxy: {
      '/api': 'https://inventoryservice.fly.dev',
      '/oauth2': 'https://inventoryservice.fly.dev',
      '/logout': 'https://inventoryservice.fly.dev',
    },
    port: 5173,
  },
  plugins: [react()],
})
