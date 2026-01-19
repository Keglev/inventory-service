/**
 * @file useSuppliersData.test.ts
 * @module tests/api/suppliers/hooks/useSuppliersData
 *
 * @summary
 * Verifies the supplier hook barrel maintains backwards-compatible re-exports.
 * Ensures legacy aliases and canonical names both reference the underlying hook implementations.
 *
 * @enterprise
 * - Protects public hook entry points from accidental regressions during refactors
 * - Confirms legacy import paths continue to work for downstream consumers
 * - Keeps coordination layer behavior explicit for auditability
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@/api/suppliers/hooks/useSupplierPageQuery', () => ({
  useSupplierPageQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/hooks/useSupplierSearchQuery', () => ({
  useSupplierSearchQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/hooks/useSupplierByIdQuery', () => ({
  useSupplierByIdQuery: vi.fn(),
}));

import {
  useSupplierPageQuery,
} from '@/api/suppliers/hooks/useSupplierPageQuery';
import { useSupplierSearchQuery } from '@/api/suppliers/hooks/useSupplierSearchQuery';
import { useSupplierByIdQuery } from '@/api/suppliers/hooks/useSupplierByIdQuery';
import {
  useSupplierPageQuery as barrelSupplierPageQuery,
  useSuppliersPageQuery,
  useSupplierSearchQuery as barrelSupplierSearchQuery,
  useSupplierByIdQuery as barrelSupplierByIdQuery,
} from '@/api/suppliers/hooks/useSuppliersData';

describe('useSuppliersData barrel', () => {
  it('exposes canonical hook implementations', () => {
    expect(barrelSupplierPageQuery).toBe(useSupplierPageQuery);
    expect(barrelSupplierSearchQuery).toBe(useSupplierSearchQuery);
    expect(barrelSupplierByIdQuery).toBe(useSupplierByIdQuery);
  });

  it('preserves legacy alias for useSuppliersPageQuery', () => {
    expect(useSuppliersPageQuery).toBe(useSupplierPageQuery);
  });
});
