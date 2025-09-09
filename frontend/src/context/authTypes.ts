/**
 * @file authTypes.ts
 * @description
 * Types for authentication context and user profile.
 */

/**
 * Minimal user profile stored client-side (subset of /api/me).
 * Extend as needed, but avoid leaking server-internal fields here.
 */
export interface AppUser {
  email: string;
  fullName: string;
  role: string;
}

/**
 * Back-compat alias for older imports; remove once callers migrate.
 * @deprecated Use {@link AppUser}.
 */
export type AuthUser = AppUser;

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
  /** Clear client-side state only (no HTTP, no navigation). */
  logout: () => void;
  /** True while hydrating the session on app startup. */
  loading: boolean;
}
