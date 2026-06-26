/**
 * @file authTypes.ts
 * @module context/auth
 * @summary
 * Core authentication type shapes (AppUser + AuthContextType)
 * consumed by AuthContext, useAuth, and auth-related guards/pages.
 *
 * @enterprise
 * - AppUser is a deliberate CLIENT-SIDE SUBSET of the /api/me
 *   server payload. Server-internal fields must not leak here.
 *   Extend only with fields the client genuinely needs.
 * - The `isDemo?` flag is set only by client-side demo session
 *   creation in AuthContext.loginAsDemo(). Server hydration
 *   intentionally drops any incoming isDemo value (see AuthContext
 *   @enterprise).
 * - AuthContextType is consumed via the useAuth hook (built on
 *   createContextHook). 14 production call sites (B2 audit).
 */

/**
 * Minimal user profile stored client-side (subset of /api/me).
 * Extend as needed, but avoid leaking server-internal fields here.
 */
export interface AppUser {
  email: string;
  fullName: string;
  role: string;       // e.g., "USER", "ADMIN", or "DEMO"
  /** True when this is a client-only demo session (no server token). */
  isDemo?: boolean;
}

/**
 * Value exposed by the AuthContext to the rest of the app.
 */
export interface AuthContextType {
  /** Current user or null if unauthenticated. */
  user: AppUser | null;
  /** Replace/clear the current user. */
  setUser: (u: AppUser | null) => void;
  /** Start OAuth2 login (full-page redirect). */
  login: () => void;
  /** Begin a local demo session (no server request). */
  loginAsDemo: () => void;
  /** Clear client-side state only (no HTTP, no navigation). */
  logout: () => void;
  /** True while hydrating the session on app startup. */
  loading: boolean;
  /** True immediately after logout is triggered to avoid guard flicker. */
  logoutInProgress: boolean;
}
