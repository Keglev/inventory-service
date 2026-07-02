/**
 * @file storageKeys.ts
 * @module context/auth/storageKeys
 *
 * @summary
 * Shared localStorage keys for the auth domain.
 *
 * @enterprise
 * - The force-logout flag is the cross-tab logout wire contract: writer
 *   (AuthContext / useSessionTimeout broadcast) and listener must agree
 *   on the exact string, so it lives in one module.
 */

/** Cross-tab force-logout broadcast flag. */
export const FORCE_LOGOUT_FLAG = 'ssp:forceLogout';
