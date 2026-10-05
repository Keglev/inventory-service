/**
 * @file demoSession.test.ts
 * @module tests/context/auth/demoSession
 * @description Contract tests for readDemoSession.
 *
 * Contract under test:
 * - Returns the stored user only when it is flagged isDemo === true.
 * - Returns null for no entry, a non-demo entry, corrupt JSON, and a storage
 *   that throws.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { readDemoSession } from '@/context/auth/demoSession';

const KEY = 'ssp.demo.session';
const demoUser = { email: 'demo@example.org', fullName: 'Demo User', role: 'DEMO', isDemo: true };

describe('readDemoSession', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns the stored user when a demo session is active', () => {
    localStorage.setItem(KEY, JSON.stringify(demoUser));
    expect(readDemoSession()).toEqual(demoUser);
  });

  it('returns null when nothing is stored', () => {
    expect(readDemoSession()).toBeNull();
  });

  it('returns null for a stored user not flagged as demo', () => {
    localStorage.setItem(KEY, JSON.stringify({ ...demoUser, isDemo: false }));
    expect(readDemoSession()).toBeNull();
  });

  it('returns null for a truthy flag that is not the boolean true', () => {
    localStorage.setItem(KEY, JSON.stringify({ ...demoUser, isDemo: 'yes' }));
    expect(readDemoSession()).toBeNull();
  });

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(KEY, 'not-json{');
    expect(readDemoSession()).toBeNull();
  });

  it('returns null when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    expect(readDemoSession()).toBeNull();
  });
});
