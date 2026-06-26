/**
 * @file useAuth.ts
 * @module hooks/useAuth
 * @summary Convenience hook bridging AuthContext to the component tree.
 * @enterprise
 * - Built via createContextHook to share the null-check + throw pattern with
 *   useHelp and useSettings.
 * - Heaviest consumer of the factory: ~14 production call sites across routes,
 *   guards, layout shell, auth pages, dashboard, inventory, suppliers, and the
 *   HamburgerMenu profile section.
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
