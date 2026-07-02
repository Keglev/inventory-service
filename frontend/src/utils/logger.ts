/**
 * @file logger.ts
 * @module utils/logger
 *
 * @summary
 * Minimal DEV-gated logging helpers. Production bundles stay silent;
 * development and test builds forward to the browser console.
 *
 * @enterprise
 * - import.meta.env.DEV is true for the dev server and for Vitest
 *   (mode 'test'), false for production builds — so failure paths remain
 *   observable in development and assertable in tests without shipping
 *   noise to production devtools.
 * - Variadic details: call sites pass zero or more payloads; nothing is
 *   appended when omitted (no trailing 'undefined' in the console).
 */

/**
 * Log an error to the console in non-production builds only.
 */
export function logError(message: string, ...details: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(message, ...details);
  }
}

/**
 * Log a warning to the console in non-production builds only.
 */
export function logWarn(message: string, ...details: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(message, ...details);
  }
}
