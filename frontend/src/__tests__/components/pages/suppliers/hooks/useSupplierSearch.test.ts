/**
 * @file useSupplierSearch.test.ts
 * @module __tests__/components/pages/suppliers/hooks/useSupplierSearch
 * @description Orchestration tests for the `useSupplierSearch` adapter.
 *
 * Contract under test:
 * - Holds the search query string and exposes setter/reset.
 * - Forwards the current query to `useSupplierSearchQuery` (the single search
 *   implementation) and maps its `data`/`isFetching` to `searchResults`/`searchLoading`.
 *
 * Out of scope (covered by useSupplierSearchQuery.test.ts):
 * - The >= 2-char gating, the /search endpoint call, caching, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

const mocks = vi.hoisted(() => ({
  useSupplierSearchQuery: vi.fn(),
}));

vi.mock('../../../../../api/suppliers', () => ({
  useSupplierSearchQuery: (...args: unknown[]) => mocks.useSupplierSearchQuery(...args),
}));

import { useSupplierSearch } from '../../../../../pages/suppliers/hooks/useSupplierSearch';

describe('useSupplierSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSupplierSearchQuery.mockReturnValue({ data: [], isFetching: false });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('forwards the query to useSupplierSearchQuery', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => {
      void result.current.handleSearchQueryChange('ac');
    });

    expect(result.current.searchQuery).toBe('ac');
    expect(mocks.useSupplierSearchQuery).toHaveBeenLastCalledWith('ac');
  });

  it('surfaces results and loading from useSupplierSearchQuery', () => {
    const items: SupplierRow[] = [
      { id: '1', name: 'Acme', contactName: null, email: null, phone: null },
    ];
    mocks.useSupplierSearchQuery.mockReturnValue({ data: items, isFetching: true });

    const { result } = renderHook(() => useSupplierSearch());

    expect(result.current.searchResults).toEqual(items);
    expect(result.current.searchLoading).toBe(true);
  });

  it('resets the query', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => {
      void result.current.handleSearchQueryChange('ac');
    });
    expect(result.current.searchQuery).toBe('ac');

    act(() => {
      result.current.resetSearch();
    });
    expect(result.current.searchQuery).toBe('');
  });
});
