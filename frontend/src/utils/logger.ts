/**
 * @file logger.ts
 * @module utils/logger
 *
 * @summary
 * Minimal DEV-gated logging helper. Production bundles stay silent;
 * development and test builds forward to the browser console.
 *
 * @enterprise
 * - import.meta.env.DEV is true for the dev server and for Vitest
 *   (mode 'test'), false for production builds — so error paths remain
 *   observable in development and assertable in tests without shipping
 *   noise to production devtools.
 * - Deliberately exposes only an error channel; other console.* call
 *   sites are migrated bucket by bucket and may extend this surface.
 */

/**
 * Log an error to the console in non-production builds only.
 */
export function logError(message: string, error?: unknown): void {
  if (import.meta.env.DEV) {
    console.error(message, error);
  }
}
