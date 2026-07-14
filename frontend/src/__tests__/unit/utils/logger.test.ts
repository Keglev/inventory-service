/**
 * @file logger.test.ts
 * @module __tests__/unit/utils/logger
 * @description Console logging helpers gated on the Vite DEV flag.
 *
 * Contract under test:
 * - In development builds, logError/logWarn forward to console with all
 *   detail arguments.
 * - In production builds, both are silent no-ops.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { logError, logWarn } from '../../../utils/logger';

// Vitest exposes import.meta.env as a mutable runtime object, so the DEV
// flag can be flipped per test and restored afterwards.
const env = import.meta.env as unknown as { DEV: boolean };
const originalDev = env.DEV;

describe('logger', () => {
  afterEach(() => {
    env.DEV = originalDev;
    vi.restoreAllMocks();
  });

  it('forwards errors with details in development', () => {
    env.DEV = true;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('boom', { code: 1 }, 'extra');

    expect(spy).toHaveBeenCalledWith('boom', { code: 1 }, 'extra');
  });

  it('forwards warnings with details in development', () => {
    env.DEV = true;
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logWarn('careful', 42);

    expect(spy).toHaveBeenCalledWith('careful', 42);
  });

  it('suppresses errors in production builds', () => {
    env.DEV = false;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('boom');

    expect(spy).not.toHaveBeenCalled();
  });

  it('suppresses warnings in production builds', () => {
    env.DEV = false;
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logWarn('careful');

    expect(spy).not.toHaveBeenCalled();
  });
});
