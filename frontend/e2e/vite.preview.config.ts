/**
 * @file vite.preview.config.ts
 * @module e2e
 * @testing Preview server config for the Playwright suite (frontend ADR-0009).
 * @description `vite preview` inherits `server.https` and `server.proxy` from
 *   the main config's dev server. Local certs would flip the origin to https,
 *   which the backend CORS list does not admit and Playwright does not poll, and
 *   the suite needs no proxy: the bundle calls the backend baked in at build
 *   time via VITE_API_BASE. This config keeps everything but the dev server
 *   block, so preview runs plain HTTP with no proxy.
 */
import { defineConfig } from 'vite';
import base from '../vite.config.ts';

// Vite resolves each preview option as `preview.x ?? server.x`. Dropping the dev
// block (https, proxy, port) leaves both unset with valid types; `https: false`
// through mergeConfig does not type-check.
export default defineConfig({
  ...base,
  server: undefined,
  preview: {
    port: 5173,
    strictPort: true,
  },
});
