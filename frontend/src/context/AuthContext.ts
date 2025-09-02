// src/context/AuthContext.ts
import { createContext } from 'react';
import type { AuthContextType } from './authTypes';

/**
 * React Context object for authentication state.
 * Kept in its own file so component files can export only components,
 * satisfying react-refresh/only-export-components.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
