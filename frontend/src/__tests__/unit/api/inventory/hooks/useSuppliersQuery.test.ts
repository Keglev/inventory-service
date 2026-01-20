/**
 * @file useSuppliersQuery.test.ts
 * @module tests/api/inventory/hooks/useSuppliersQuery
 *
 * @summary
 * Validates the supplier lookup hook contracts by mocking React Query.
 * Confirms queryKey composition, enabled gating, and SupplierOption normalization.
 *
 * @enterprise
 * - Prevents cache key regressions that could de-dupe unrelated queries
 * - Ensures backend DTOs stay normalized for dropdown consumers
 * - Guarantees optional fetch gating keeps dialogs performant
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

describe('useSuppliersQuery', () => {
  it('configures query with normalized mapper and cache window', async () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });
    getSuppliersLiteMock.mockResolvedValue([
      { id: 'SUP-1', name: 'Acme' },
    ]);

    const result = useSuppliersQuery(true);

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({
      queryKey: ['suppliers', 'lite'],
      enabled: true,
      staleTime: 5 * 60 * 1000,
    }));

    const cfg = mockQuery.mock.calls[0][0];
    expect(await cfg.queryFn()).toEqual([{ id: 'SUP-1', label: 'Acme' }]);
    expect(getSuppliersLiteMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: undefined });
  });

  it('respects disabled flag to short-circuit fetch', () => {
    const mockQuery = vi.fn();
    useQueryMock.mockImplementation((config) => {
      mockQuery(config);
      return { data: undefined };
    });

    useSuppliersQuery(false);

    expect(mockQuery).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(getSuppliersLiteMock).not.toHaveBeenCalled();
  });
});