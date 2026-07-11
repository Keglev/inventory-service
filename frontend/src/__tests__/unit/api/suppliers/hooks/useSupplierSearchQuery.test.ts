/**
 * @file useSupplierSearchQuery.test.ts
 * @module tests/unit/api/suppliers/hooks/useSupplierSearchQuery
 * @description Contract tests for useSupplierSearchQuery.
 *
 * Contract under test:
 * - Guarantees the hook's contract: stable search queryKey composition,
 *   enablement gating for short/blank terms, and deterministic empty
 *   results without calling the backend when gated.
 *
 * Out of scope:
 * - Supplier list fetcher behavior beyond parameter forwarding (HTTP
 *   wiring and response parsing).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/supplierListFetcher', () => ({
  searchSuppliersByName: vi.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { searchSuppliersByName } from '@/api/suppliers/supplierListFetcher';
import { useSupplierSearchQuery } from '@/api/suppliers/hooks/useSupplierSearchQuery';
import type { SupplierRow } from '@/api/suppliers/types';
import {
  arrangeUseQueryConfigCapture,
  arrangeUseQueryConfigCollector,
} from '../../../utils/reactQueryCapture';

const useQueryMock = useQuery as unknown as ReturnType<typeof vi.fn>;
const searchSuppliersByNameMock = searchSuppliersByName as ReturnType<typeof vi.fn>;

describe('useSupplierSearchQuery', () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    searchSuppliersByNameMock.mockReset();
  });

  it('wires the search query to backend search endpoint when length threshold met', async () => {
    const queryHandle = { data: undefined };
    const term = 'acme';
    const rows: SupplierRow[] = [{ id: 'SUP-5', name: 'Acme Labs' } as SupplierRow];

    const { getConfig } = arrangeUseQueryConfigCapture<SupplierRow[]>(useQueryMock, queryHandle);

    searchSuppliersByNameMock.mockResolvedValue(rows);

    const hookResult = useSupplierSearchQuery(term, true);

    expect(useQueryMock).toHaveBeenCalledTimes(1);
    const capturedConfig = getConfig();
    expect(capturedConfig).toMatchObject({
      queryKey: ['suppliers', 'search', term],
      enabled: true,
      staleTime: 60_000,
      gcTime: 5 * 60_000,
    });

    const payload = await capturedConfig.queryFn();
    expect(payload).toEqual(rows);
    expect(searchSuppliersByNameMock).toHaveBeenCalledOnce();
    expect(searchSuppliersByNameMock).toHaveBeenCalledWith(term);
    expect(hookResult).toBe(queryHandle);
  });

  it('short-circuits short or blank queries without hitting the backend', async () => {
    const { configs } = arrangeUseQueryConfigCollector<SupplierRow[]>(useQueryMock);

    useSupplierSearchQuery('A');
    useSupplierSearchQuery('   ');

    expect(configs[0]).toMatchObject({
      queryKey: ['suppliers', 'search', 'A'],
      enabled: false,
    });

    const blankResult = await configs[1]!.queryFn();
    expect(blankResult).toEqual([]);
    expect(configs[1]).toMatchObject({ queryKey: ['suppliers', 'search', '   '] });
    expect(searchSuppliersByNameMock).not.toHaveBeenCalled();
  });
});
