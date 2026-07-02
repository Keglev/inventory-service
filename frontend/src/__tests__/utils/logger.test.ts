/**
 * @file logger.test.ts
 * @module __tests__/utils/logger
 * @description Unit tests for the DEV-gated logError helper.
 *
 * Contract under test:
 * - Under Vitest, import.meta.env.DEV is true, so logError forwards
 *   message and error to console.error.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

import { logError, logWarn } from '@/utils/logger';

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('forwards message and error to console.error in DEV', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const boom = new Error('boom');
    logError('Something failed:', boom);

    expect(spy).toHaveBeenCalledWith('Something failed:', boom);
  });

  it('accepts a message without an error object', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logError('Standalone message');

    expect(spy).toHaveBeenCalledWith('Standalone message');
  });

  it('forwards warnings to console.warn in DEV', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logWarn('Something looks off:', 42);

    expect(spy).toHaveBeenCalledWith('Something looks off:', 42);
  });
});
