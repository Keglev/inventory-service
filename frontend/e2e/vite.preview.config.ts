/**
 * @file vite.preview.config.ts
 * @module e2e
 * @testing Preview server config for the Playwright suite (ADR-0009).
 * @description `vite preview` inherits `server.https` and `server.proxy` from
 *   the main config. Both are wrong for e2e: local certs would flip the origin
 *   to https (which the backend CORS list does not admit and Playwright does
 *   not poll), and the proxy would forward relative /api calls to production.
 *   This config keeps everything else and forces plain HTTP with no proxy, so
 *   the only backend the suite can reach is the local one baked in at build
 *   time via VITE_API_BASE.
 */
import { defineConfig, mergeConfig } from 'vite';
import base from '../vite.config';

export default mergeConfig(
  base,
  defineConfig({
    preview: {
      https: false,
      proxy: {},
      port: 5173,
      strictPort: true,
    },
  }),
);
