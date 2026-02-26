/**
 * @file useSuppliersQuery.test.ts
 * @module tests/unit/api/inventory/hooks/useSuppliersQuery
 * @what_is_under_test useSuppliersQuery
 * @responsibility
 * Guarantees the hook’s public contract: stable cache key, enabled gating, and normalization
 * of supplier DTOs into dropdown-ready `SupplierOption` values.
 * @out_of_scope
 * Supplier source-of-truth correctness (backend data quality and filtering semantics).
 * @out_of_scope
 * React Query runtime behavior (cache invalidation, retry/backoff, observer lifecycles).
 */

import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/analytics/suppliers', () => ({
  getSuppliersLite: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { getSuppliersLite } from '@/api/analytics/suppliers';
import { useSuppliersQuery } from '@/api/inventory/hooks/useSuppliersQuery';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersLiteMock = getSuppliersLite as ReturnType<typeof vi.fn>;

function arrangeUseQueryConfigCapture() {
  useQueryMock.mockImplementation(() => ({ data: undefined }));
}

describe('useSuppliersQuery', () => {
  it('configures query with normalized mapper and cache window', async () => {
    arrangeUseQueryConfigCapture();
    getSuppliersLiteMock.mockResolvedValue([
      { id: 'SUP-1', name: 'Acme' },
    ]);

    const result = useSuppliersQuery(true);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['suppliers', 'lite'],
      enabled: true,
      staleTime: 5 * 60 * 1000,
    }));

    const cfg = useQueryMock.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([{ id: 'SUP-1', label: 'Acme' }]);
    expect(getSuppliersLiteMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: undefined });
  });

  it('respects disabled flag to short-circuit fetch', () => {
    arrangeUseQueryConfigCapture();

    useSuppliersQuery(false);

    expect(useQueryMock).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(getSuppliersLiteMock).not.toHaveBeenCalled();
  });
});