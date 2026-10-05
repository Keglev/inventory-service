/**
 * @file i18n.test.ts
 * @module tests/unit/i18n/i18n
 * @description Contract tests for i18n constants and the document language.
 *
 * Contract under test:
 * - Guarantees the exported i18n constants used by the UI: stable
 *   localStorage key and a deterministic, validated namespace list
 *   (non-empty, unique, and consistently cased).
 * - Keeps <html lang> on the active language, from the first load on.
 *
 * Out of scope:
 * - Translation correctness (content, pluralization rules, and localized
 *   strings).
 */

import { describe, expect, it, vi } from 'vitest';
import i18next from 'i18next';
import { I18N_LS_KEY, I18N_NAMESPACES } from '@/i18n';

// jsdom cannot serve /locales/*.json and the backend retries a failed load for
// about 11 s before init completes. A one-key bundle lets init finish at once
// and counts as a loaded language, which resolvedLanguage requires.
vi.hoisted(() => {
  vi.stubGlobal('fetch', async () => new Response('{"k":"v"}', { headers: { 'Content-Type': 'application/json' } }));
});

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
      'legal',
      'landing',
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

describe('document language', () => {
  it('follows the active language, from the first load on', async () => {
    // jsdom starts with lang=""; German is the first-visit default.
    await vi.waitFor(() => expect(document.documentElement.lang).toBe('de'));

    await i18next.changeLanguage('en-US');
    expect(document.documentElement.lang).toBe('en');

    await i18next.changeLanguage('de');
    expect(document.documentElement.lang).toBe('de');
  });
});
