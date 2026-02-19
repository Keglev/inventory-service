/**
 * @file useSupplierSearch.test.ts
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/useSupplierSearch
 * @description Orchestration tests for the `useSupplierSearch` hook.
 *
 * Contract under test:
 * - Maintains a search query, results list, and loading flag.
 * - Does not call the API until a minimum query length is met (>= 2 trimmed characters).
 * - When query is valid, calls `getSuppliersPage` with the expected paging parameters.
 * - On API success, surfaces the returned `items`.
 * - On API failure, clears results and resets loading.
 *
 * Out of scope:
 * - UI rendering (covered by component tests).
 * - Supplier filtering/sorting behavior beyond what the API returns.
 *
 * Test strategy:
 * - Deterministic, hoisted mock for the API layer.
 * - Assertions focus on observable state + API calls, not React state implementation details.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

const mocks = vi.hoisted(() => ({
  getSuppliersPage: vi.fn(),
}));

vi.mock('../../../../../api/suppliers', () => ({
  getSuppliersPage: (...args: [unknown]) => mocks.getSuppliersPage(...args),
}));

import { useSupplierSearch } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch';

describe('useSupplierSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('does not call API when query is shorter than 2 characters', async () => {
    const { result } = renderHook(() => useSupplierSearch());

    await act(async () => {
      await result.current.handleSearchQueryChange('a');
    });

    expect(mocks.getSuppliersPage).not.toHaveBeenCalled();
    expect(result.current.searchQuery).toBe('a');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('calls API and surfaces results when query is valid', async () => {
    const items: SupplierRow[] = [
      { id: '1', name: 'Acme', contactName: null, email: null, phone: null },
    ];
    mocks.getSuppliersPage.mockResolvedValue({ items });

    const { result } = renderHook(() => useSupplierSearch());

    await act(async () => {
      await result.current.handleSearchQueryChange('ac');
    });

    expect(mocks.getSuppliersPage).toHaveBeenCalledWith({ page: 1, pageSize: 10, q: 'ac' });
    expect(result.current.searchResults).toEqual(items);
    expect(result.current.searchLoading).toBe(false);
  });

  it('clears results when API call fails', async () => {
    mocks.getSuppliersPage.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useSupplierSearch());

    await act(async () => {
      await result.current.handleSearchQueryChange('ac');
    });

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('resets query and results', async () => {
    const items: SupplierRow[] = [
      { id: '1', name: 'Acme', contactName: null, email: null, phone: null },
    ];
    mocks.getSuppliersPage.mockResolvedValue({ items });

    const { result } = renderHook(() => useSupplierSearch());

    await act(async () => {
      await result.current.handleSearchQueryChange('ac');
    });
    expect(result.current.searchQuery).toBe('ac');
    expect(result.current.searchResults).toEqual(items);

    act(() => {
      result.current.resetSearch();
    });
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
  });
});
