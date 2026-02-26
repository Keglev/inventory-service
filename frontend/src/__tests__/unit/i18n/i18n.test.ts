/**
 * @file i18n.test.ts
 * @module tests/unit/i18n/i18n
 * @what_is_under_test i18n constants
 * @responsibility
 * Guarantees the exported i18n constants used by the UI: stable localStorage key and a deterministic,
 * validated namespace list (non-empty, unique, and consistently cased).
 * @out_of_scope
 * i18next runtime initialization (resource loading, language detection, and async backend wiring).
 * @out_of_scope
 * Translation correctness (content, pluralization rules, and localized strings).
 */

import { describe, expect, it } from 'vitest';
import { I18N_LS_KEY, I18N_NAMESPACES } from '@/i18n';

describe('i18n constants', () => {
  it('exports a stable localStorage key', () => {
    expect(I18N_LS_KEY).toBe('i18nextLng');
  });

  it('exports the expected namespaces in a deterministic order', () => {
    expect(I18N_NAMESPACES).toEqual([
      'common',
      'auth',
      'system',
      'analytics',
      'inventory',
      'errors',
      'suppliers',
      'footer',
      'help',
    ]);
  });

  it('maintains namespace invariants required by loaders and routing', () => {
    expect(I18N_NAMESPACES.length).toBeGreaterThan(0);

    const uniqueNamespaces = new Set(I18N_NAMESPACES);
    expect(uniqueNamespaces.size).toBe(I18N_NAMESPACES.length);

    const hasEmpty = I18N_NAMESPACES.some((ns) => !ns || ns.trim() === '');
    expect(hasEmpty).toBe(false);

    const allLowercase = I18N_NAMESPACES.every((ns) => ns === ns.toLowerCase());
    expect(allLowercase).toBe(true);
  });
});
