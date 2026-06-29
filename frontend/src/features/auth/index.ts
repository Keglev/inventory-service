/**
 * @file features/auth/index.ts
 * @module features/auth
 * @summary
 * Barrel re-export for the auth feature module (RequireAuth guard + useSessionTimeout hook).
 */

export { RequireAuth } from './guards/RequireAuth';
export { useSessionTimeout } from './hooks/useSessionTimeout';
