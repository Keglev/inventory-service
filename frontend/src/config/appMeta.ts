/**
 * @file appMeta.ts
 * @module config/appMeta
 *
 * @summary
 * Build-time application metadata: version, build id, environment label.
 *
 * @enterprise
 * - VITE_APP_VERSION is injected by vite.config from package.json in every
 *   mode, tests included (vitest.config extends vite.config); its fallback
 *   only guards a build that bypasses vite.config.
 * - VITE_BUILD_ID (git SHA) and VITE_APP_ENVIRONMENT arrive as Docker
 *   build args from CI. Local dev and tests see their fallbacks.
 * - Every UI surface that shows them (the footer, the About dialog) reads from
 *   here — never hardcode these values at a call site.
 */

/** Application version, from package.json at build time. */
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION ?? '0.0.0-dev';

/** Full git SHA of the build, injected by CI; the UI shows its first 10 characters. */
export const BUILD_ID: string = import.meta.env.VITE_BUILD_ID ?? 'dev';

/** Human-readable deployment environment label. */
export const APP_ENVIRONMENT: string = import.meta.env.VITE_APP_ENVIRONMENT ?? 'Development (local)';
