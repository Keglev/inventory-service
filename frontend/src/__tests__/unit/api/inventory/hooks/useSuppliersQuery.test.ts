/**
 * @file useSuppliersQuery.test.ts
 * @module tests/unit/api/inventory/hooks/useSuppliersQuery
 * @description Contract tests for useSuppliersQuery.
 *
 * Contract under test:
 * - Guarantees the hook reads the shared supplier list entry (same key,
 *   loader and cache window as useSupplierListQuery), gates on `enabled`,
 *   and selects dropdown-ready `SupplierOption` values from the rows.
 *
 * Out of scope:
 * - React Query runtime behavior (cache sharing and invalidation are proven
 *   with a real QueryClient in supplierListSharing.test.tsx).
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  getAllSuppliers: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { getAllSuppliers } from '@/api/suppliers/supplierListFetcher';
import { useSuppliersQuery } from '@/api/inventory/hooks/useSuppliersQuery';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;

describe('useSuppliersQuery', () => {
  it('reads the shared supplier list entry and selects options', () => {
    useQueryMock.mockReturnValue({ data: undefined });

    const result = useSuppliersQuery(true);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['suppliers', 'list'],
      queryFn: getAllSuppliers,
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    }));
    const cfg = useQueryMock.mock.calls[0][0];
    expect(cfg.select([{ id: 'SUP-1', name: 'Acme', email: 'a@acme.example' }]))
      .toEqual([{ id: 'SUP-1', label: 'Acme' }]);
    expect(result).toEqual({ data: undefined });
  });

  it('respects disabled flag to short-circuit fetch', () => {
    useQueryMock.mockReturnValue({ data: undefined });

    useSuppliersQuery(false);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(getAllSuppliers).not.toHaveBeenCalled();
  });
});
