/**
 * @file useAuth.ts
 * @description
 * Convenience hook for accessing the authentication context.
 */

import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthContextType } from './authTypes';

/**
 * Access the global authentication context.
 * @throws Error if used outside of <AuthProvider>.
 */
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

