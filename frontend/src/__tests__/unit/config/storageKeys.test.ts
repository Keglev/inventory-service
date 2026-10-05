/**
 * @file storageKeys.test.ts
 * @module tests/unit/config/storageKeys
 * @description Contract tests for the browser-storage keys.
 *
 * Contract under test:
 * - Every key keeps its value: browsers already hold data under these names,
 *   and a renamed key silently drops the visitor's stored choice.
 * - The keys are distinct.
 *
 * Out of scope:
 * - What each consumer stores under its key (tested with the consumer).
 */

import { describe, expect, it } from 'vitest';
import * as keys from '@/config/storageKeys';

describe('storage keys', () => {
  it('keeps every key at the value browsers already hold', () => {
    // Spread: a module namespace also carries Symbol.toStringTag.
    expect({ ...keys }).toEqual({
      LANGUAGE_KEY: 'i18nextLng',
      THEME_MODE_KEY: 'themeMode',
      SETTINGS_KEY: 'appSettings',
      DEMO_SESSION_KEY: 'ssp.demo.session',
      FORCE_LOGOUT_FLAG: 'ssp:forceLogout',
    });
  });

  it('gives every stored value its own key', () => {
    const values = Object.values(keys);
    expect(new Set(values).size).toBe(values.length);
  });
});
