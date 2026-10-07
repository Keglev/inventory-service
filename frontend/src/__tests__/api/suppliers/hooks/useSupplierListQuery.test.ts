/**
 * @file useSupplierListQuery.test.ts
 * @module tests/api/suppliers/hooks/useSupplierListQuery
 * @description Contract tests for useSupplierListQuery.
 *
 * Contract under test:
 * - Guarantees the hook's contract: one fixed queryKey for the full list
 *   (no page or sort in it, so paging and sorting never refetch), enablement
 *   gating via the optional flag, and the supplier list fetcher as loader.
 *
 * Out of scope:
 * - Supplier list fetcher implementation (HTTP wiring and response
 *   parsing are tested separately).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  getAllSuppliers: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { getAllSuppliers } from '@/api/suppliers/supplierListFetcher';
import { useSupplierListQuery } from '@/api/suppliers/hooks/useSupplierListQuery';
import type { SupplierRow } from '@/api/suppliers/types';
import { arrangeUseQueryConfigCapture } from '@/__tests__/utils/reactQueryCapture';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getAllSuppliersMock = getAllSuppliers as ReturnType<typeof vi.fn>;

describe('useSupplierListQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getAllSuppliersMock.mockReset();
  });

  it('caches the full list under one key and loads it with the list fetcher', async () => {
    const queryEnvelope = { data: undefined };
    const { getConfig } = arrangeUseQueryConfigCapture<SupplierRow[]>(useQueryMock, queryEnvelope);

    const rows = [{ id: 'SUP-3', name: 'Acme Distribution' }];
    getAllSuppliersMock.mockResolvedValue(rows);

    const hookResult = useSupplierListQuery();

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const capturedConfig = getConfig();
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'list'],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig.queryFn();
    expect(payload).toBe(rows);
    expect(getAllSuppliersMock).toHaveBeenCalledTimes(1);
    expect(hookResult).toBe(queryEnvelope);
  });

  it('honors disabled flag to avoid remote fetches', () => {
    const { getConfig } = arrangeUseQueryConfigCapture<SupplierRow[]>(useQueryMock);

    useSupplierListQuery(false);

    expect(getConfig()).toMatchObject({ enabled: false });
    expect(getAllSuppliersMock).not.toHaveBeenCalled();
  });
});
