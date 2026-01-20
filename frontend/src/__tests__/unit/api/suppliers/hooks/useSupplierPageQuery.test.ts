/**
 * @file useSupplierPageQuery.test.ts
 * @module tests/api/suppliers/hooks/useSupplierPageQuery
 *
 * @summary
 * Exercises the paginated supplier hook configuration by stubbing React Query.
 * Validates cache keys, parameter passthrough, and enablement controls.
 *
 * @enterprise
 * - Protects pagination views from cache collisions when params change
 * - Ensures backend invocations always receive the caller-supplied filters
 * - Confirms the optional enabled flag truly gates expensive list fetches
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

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const getSuppliersPageMock = getSuppliersPage as ReturnType<typeof vi.fn>;

interface MockQueryConfig<TData> {
  queryKey: unknown;
  queryFn: () => Promise<TData> | TData;
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
}

describe('useSupplierPageQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getSuppliersPageMock.mockReset();
  });

  it('configures query with parameter-aware key and forwards loader', async () => {
    let capturedConfig: MockQueryConfig<SupplierListResponse> | undefined;
    const queryEnvelope = { data: undefined };
    const params = { page: 2, pageSize: 25, q: 'acme', sort: 'name,asc' } as const;

    useQueryMock.mockImplementation((config) => {
      capturedConfig = config as MockQueryConfig<SupplierListResponse>;
      return queryEnvelope;
    });

    const response = {
      items: [{ id: 'SUP-3', name: 'Acme Distribution' }],
      total: 40,
      page: 2,
      pageSize: 25,
    };
    getSuppliersPageMock.mockResolvedValue(response);

    const hookResult = useSupplierPageQuery(params);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'page', params.page, params.pageSize, params.q, params.sort],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig!.queryFn();
    expect(payload).toBe(response);
    expect(getSuppliersPageMock).toHaveBeenCalledWith(params);
    expect(hookResult).toBe(queryEnvelope);
  });

  it('honors disabled flag to avoid remote fetches', () => {
    let capturedConfig: MockQueryConfig<SupplierListResponse> | undefined;
    useQueryMock.mockImplementation((config) => {
      capturedConfig = config as MockQueryConfig<SupplierListResponse>;
      return { data: undefined };
    });

    useSupplierPageQuery({ page: 1, pageSize: 10 }, false);

    expect(capturedConfig).toMatchObject({ enabled: false });
    expect(getSuppliersPageMock).not.toHaveBeenCalled();
  });
});
