/**
 * @file AuthProvider.tsx
 * @module context/auth
 * @summary
 * Re-export shim providing a .tsx import surface for AuthProvider
 * whose implementation lives in AuthContext.ts.
 *
 * @enterprise
 * - Exists so consumers expecting `import AuthProvider from
 *   '.../AuthProvider'` (a .tsx Provider convention) get a stable
 *   import path. The actual implementation stays in AuthContext.ts
 *   to keep the auth context module .ts-only (no JSX pragma needed —
 *   see AuthContext.ts @enterprise).
 */
export { AuthProvider as default } from './AuthContext';
