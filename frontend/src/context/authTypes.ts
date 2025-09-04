// src/context/authTypes.ts

/** Shape returned by /api/me and stored in the AuthContext. */
export interface AppUser {
  email: string;
  fullName: string;
  role: string;
}

/** Back-compat alias: remove later after you’ve updated imports. */
export type AuthUser = AppUser;

/** Value exposed by the AuthContext. */
export interface AuthContextType {
  /** Current user or null if unauthenticated. */
  user: AppUser | null;
  /** Replace/clear the current user. */
  setUser: (u: AppUser | null) => void;
  /** Start Google OAuth2 (full-page redirect to backend). */
  login: () => void;
  /** Clear client-side state only (no HTTP, no navigation). */
  logout: () => void;
  /** True while hydrating session on app startup. */
  loading: boolean;
}
