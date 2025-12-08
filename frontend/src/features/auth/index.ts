/**
 * @file features/auth/index.ts
 * @description
 * Barrel export for authentication feature.
 * Exports guards, hooks, and components for authentication functionality.
 */

export { RequireAuth } from './guards/RequireAuth';
export { useSessionTimeout } from './hooks/useSessionTimeout';
