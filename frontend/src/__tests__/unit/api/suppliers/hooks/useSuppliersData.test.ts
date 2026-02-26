/**
 * @file useSuppliersData.test.ts
 * @module tests/unit/api/suppliers/hooks/useSuppliersData
 * @what_is_under_test useSuppliersData barrel (re-exports)
 * @responsibility
 * Guarantees the module’s public surface remains stable by re-exporting canonical supplier hooks
 * and preserving legacy aliases expected by downstream consumers.
 * @out_of_scope
 * Behavior of the underlying hooks (covered by their dedicated unit tests).
 * @out_of_scope
 * React Query behavior and network interactions (not exercised by barrel modules).
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
