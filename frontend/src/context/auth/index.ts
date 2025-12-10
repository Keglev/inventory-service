/**
 * @file index.ts
 * @description
 * Barrel export for the auth context module.
 * Allows consumers to import from `context/auth` directly.
 */
export { AuthProvider, AuthContext } from './AuthContext';
export type { AuthContextType, AppUser } from './authTypes';
