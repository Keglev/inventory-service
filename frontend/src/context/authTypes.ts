// src/context/authTypes.ts

/**
 * Front-end user shape stored in the AuthContext.
 * Matches the /api/me response contract:
 *   { email, fullName, role, pictureUrl? }
 */
export interface AppUser {
  email: string;
  fullName: string;
  role: string;   // "USER" | "ADMIN" (string keeps it flexible)
  pictureUrl?: string;
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setUser: (user: AppUser | null) => void;
}
