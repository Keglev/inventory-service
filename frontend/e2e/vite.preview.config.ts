/**
 * @file vite.preview.config.ts
 * @module e2e
 * @testing Preview server config for the Playwright suite (ADR-0009).
 * @description `vite preview` inherits `server.https` and `server.proxy` from
 *   the main config's dev server. Both are wrong for e2e: local certs would flip
 *   the origin to https (which the backend CORS list does not admit and
 *   Playwright does not poll), and the proxy would forward relative /api calls
 *   to production. This config keeps everything but the dev server block, so
 *   preview runs plain HTTP with no proxy and the only backend the suite can
 *   reach is the local one baked in at build time via VITE_API_BASE.
 */
import { defineConfig } from 'vite';
import base from '../vite.config.ts';

// Vite resolves each preview option as `preview.x ?? server.x`, so preview
// inherits the dev server's https and proxy. The dev block sets only those two
// and its port; dropping it leaves both unset (plain HTTP, no proxy) with valid
// types, which `https: false` through mergeConfig did not have.
export default defineConfig({
  ...base,
  server: undefined,
  preview: {
    port: 5173,
    strictPort: true,
  },
});
