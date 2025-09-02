// src/context/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './authTypes';

/**
 * Hook for accessing the global authentication context.
 * Ensures consumers are wrapped in <AuthProvider>.
 */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

