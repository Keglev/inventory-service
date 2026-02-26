/**
 * @file useSupplierPageQuery.test.ts
 * @module tests/unit/api/suppliers/hooks/useSupplierPageQuery
 * @what_is_under_test useSupplierPageQuery
 * @responsibility
 * Guarantees the hook’s contract: parameter-aware queryKey composition, enablement gating via the
 * optional flag, and strict forwarding of loader parameters to the supplier list fetcher.
 * @out_of_scope
 * React Query runtime behavior (cache lifetimes, retries, background refetching, observer lifecycles).
 * @out_of_scope
 * Supplier list fetcher implementation (HTTP wiring and response parsing are tested separately).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  getSuppliersPage: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { getSuppliersPage } from '@/api/suppliers/supplierListFetcher';
import { useSupplierPageQuery } from '@/api/suppliers/hooks/useSupplierPageQuery';
import type { SupplierListResponse } from '@/api/suppliers/types';
import { arrangeUseQueryConfigCapture } from '../../../utils/reactQueryCapture';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

describe('useSupplierPageQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('configures query with parameter-aware key and forwards loader', async () => {
    const queryEnvelope = { data: undefined };
    const params = { page: 2, pageSize: 25, q: 'acme', sort: 'name,asc' } as const;

    const { getConfig } = arrangeUseQueryConfigCapture<SupplierListResponse>(useQueryMock, queryEnvelope);

    const response = {
      items: [{ id: 'SUP-3', name: 'Acme Distribution' }],
      total: 40,
      page: 2,
      pageSize: 25,
    };
    getSuppliersPageMock.mockResolvedValue(response);

    const hookResult = useSupplierPageQuery(params);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const capturedConfig = getConfig();
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'page', params.page, params.pageSize, params.q, params.sort],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig.queryFn();
    expect(payload).toBe(response);
    expect(getSuppliersPageMock).toHaveBeenCalledWith(params);
    expect(hookResult).toBe(queryEnvelope);
  });

  it('honors disabled flag to avoid remote fetches', () => {
    const { getConfig } = arrangeUseQueryConfigCapture<SupplierListResponse>(useQueryMock);

    useSupplierPageQuery({ page: 1, pageSize: 10 }, false);

    expect(getConfig()).toMatchObject({ enabled: false });
    expect(getSuppliersPageMock).not.toHaveBeenCalled();
  });
});
