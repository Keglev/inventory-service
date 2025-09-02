// src/context/authTypes.ts

export interface AppUser {
  email: string;
  fullName: string;
  role: string;
}

export interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  setUser: (user: AppUser | null) => void;
}
