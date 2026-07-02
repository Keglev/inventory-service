/**
 * @file appMeta.ts
 * @module config/appMeta
 *
 * @summary
 * Build-time application metadata: version, build id, environment label.
 *
 * @enterprise
 * - VITE_APP_VERSION is injected by vite.config from package.json;
 *   VITE_BUILD_ID (git SHA) and VITE_APP_ENVIRONMENT arrive as Docker
 *   build args from CI. Local dev and tests see the fallbacks.
 * - All UI surfaces (footer, sidebar, system-info menu) read from here —
 *   never hardcode these values at a call site.
 */

/** Application version, from package.json at build time. */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0-dev';

/** Short git SHA of the build, injected by CI. */
export const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? 'dev';

/** Human-readable deployment environment label. */
export const APP_ENVIRONMENT: string = import.meta.env.VITE_APP_ENVIRONMENT ?? 'Development (local)';
