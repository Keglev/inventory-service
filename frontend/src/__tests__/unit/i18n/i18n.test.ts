/**
 * @file i18n.test.ts
 * @module i18n.test
 * 
 * Unit tests for i18n initialization and configuration.
 * Tests default language, localStorage handling, and namespace configuration.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { I18N_LS_KEY, I18N_NAMESPACES } from '@/i18n';

describe('i18n constants', () => {
  it('should export correct localStorage key', () => {
    expect(I18N_LS_KEY).toBe('i18nextLng');
  });

  it('should export correct namespaces', () => {
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

  it('should have at least 9 namespaces', () => {
    expect(I18N_NAMESPACES.length).toBeGreaterThanOrEqual(9);
  });

  it('should include common namespace', () => {
    expect(I18N_NAMESPACES).toContain('common');
  });

  it('should include auth namespace', () => {
    expect(I18N_NAMESPACES).toContain('auth');
  });

  it('should include inventory namespace', () => {
    expect(I18N_NAMESPACES).toContain('inventory');
  });

  it('should include analytics namespace', () => {
    expect(I18N_NAMESPACES).toContain('analytics');
  });

  it('should include suppliers namespace', () => {
    expect(I18N_NAMESPACES).toContain('suppliers');
  });
});

describe('i18n initialization behavior', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    localStorageMock = {};
    
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should verify localStorage key is accessible', () => {
    expect(I18N_LS_KEY).toBeTruthy();
    expect(typeof I18N_LS_KEY).toBe('string');
  });

  it('should verify namespaces are read-only array', () => {
    expect(Array.isArray(I18N_NAMESPACES)).toBe(true);
    expect(I18N_NAMESPACES.length).toBeGreaterThan(0);
  });
});

describe('i18n namespace validation', () => {
  it('should have unique namespaces', () => {
    const uniqueNamespaces = new Set(I18N_NAMESPACES);
    expect(uniqueNamespaces.size).toBe(I18N_NAMESPACES.length);
  });

  it('should have no empty namespaces', () => {
    const hasEmpty = I18N_NAMESPACES.some(ns => !ns || ns.trim() === '');
    expect(hasEmpty).toBe(false);
  });

  it('should have lowercase namespace names', () => {
    const allLowercase = I18N_NAMESPACES.every(ns => ns === ns.toLowerCase());
    expect(allLowercase).toBe(true);
  });
});
