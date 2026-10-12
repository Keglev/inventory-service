/**
 * @file useAuth.ts
 * @module hooks/useAuth
 * @summary Convenience hook bridging AuthContext to the component tree.
 * @enterprise
 * - Built via createContextHook to share the null-check + throw pattern with
 *   useHelp and useSettings.
 * - Heaviest consumer of the factory: 15 production call sites (measured
 *   2026-10-12) across routes, guards, the layout shell, the auth, home,
 *   analytics, inventory, suppliers and system pages, and the avatar menu
 *   (AccountMenu).
 * - Throws "useAuth must be used within the corresponding provider" when called
 *   outside <AuthProvider>; tested.
 */

import { AuthContext } from '../context/auth/AuthContext';
import type { AuthContextType } from '../context/auth/authTypes';
import { createContextHook } from './createContextHook';

/**
 * Access the global authentication context.
 * @throws Error if used outside of <AuthProvider>.
 */
export const useAuth = createContextHook<AuthContextType>(AuthContext, 'useAuth');
