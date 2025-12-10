/**
 * @file useAuth.ts
 * @description
 * Convenience hook for accessing the authentication context.
 */

import { AuthContext } from '../context/auth/AuthContext';
import type { AuthContextType } from '../context/auth/authTypes';
import { createContextHook } from './createContextHook';

/**
 * Access the global authentication context.
 * @throws Error if used outside of <AuthProvider>.
 */
export const useAuth = createContextHook<AuthContextType>(AuthContext, 'useAuth');
