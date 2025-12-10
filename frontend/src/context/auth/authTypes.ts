/**
 * @file authTypes.ts
 * @enterprise
 * Core authentication shapes for SmartSupplyPro.
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
}
