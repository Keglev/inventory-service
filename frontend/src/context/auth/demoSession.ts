/**
 * @file demoSession.ts
 * @module context/auth/demoSession
 *
 * @summary
 * Reads the stored demo session, if one is active.
 *
 * @enterprise
 * - One reader for two callers: AuthContext hydrates the demo user from it,
 *   and httpClient skips the login redirect on a 401 while a demo runs (a
 *   demo has no server session, so 401s are expected there).
 * - Plain module without React: httpClient cannot import AuthContext, which
 *   imports httpClient.
 */

import type { AppUser } from './authTypes';
import { DEMO_SESSION_KEY } from '../../config/storageKeys';

/** The stored demo user when a demo session is active, otherwise null. */
export function readDemoSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(DEMO_SESSION_KEY);
    const demo = raw ? (JSON.parse(raw) as AppUser | null) : null;
    return demo?.isDemo === true ? demo : null;
  } catch {
    // WHY: localStorage can throw (Safari private mode, quota exceeded, disabled
    // storage) or hold corrupt JSON from an older version; neither is a demo.
    return null;
  }
}
