/**
 * @file useSupplierSearch.test.ts
 * @module __tests__/pages/suppliers/hooks/useSupplierSearch
 * @description Contract tests for the dialogs' `useSupplierSearch` hook.
 *
 * Contract under test:
 * - Holds the search text and exposes change/reset.
 * - Matches the text against the cached supplier list in the browser
 *   (useSupplierListQuery); typing sends no request.
 * - searchLoading follows the list's first load.
 *
 * Out of scope (covered by matchSuppliers.test.ts):
 * - The matching rule itself.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { SupplierRow } from '@/api/suppliers/types';

const mocks = vi.hoisted(() => ({
  useSupplierListQuery: vi.fn(),
}));

vi.mock('@/api/suppliers/hooks/useSupplierListQuery', () => ({
  useSupplierListQuery: (...args: unknown[]) => mocks.useSupplierListQuery(...args),
}));

import { useSupplierSearch } from '@/pages/suppliers/hooks/useSupplierSearch';

const list: SupplierRow[] = [
  { id: '1', name: 'Nordbay Industriebedarf GmbH', contactName: null, email: null, phone: null },
  { id: '2', name: 'TechSeal Dichtungen GmbH', contactName: null, email: null, phone: null },
];

describe('useSupplierSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useSupplierListQuery.mockReturnValue({ data: list, isLoading: false });
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchQuery).toBe('');
    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(false);
  });

  it('matches the typed text against the cached list', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.handleSearchQueryChange('dicht'));

    expect(result.current.searchQuery).toBe('dicht');
    expect(result.current.searchResults).toEqual([list[1]]);
    // The full list is the only request; the query takes no search text.
    expect(mocks.useSupplierListQuery).toHaveBeenLastCalledWith();
  });

  it('reports loading while the list loads, with no results yet', () => {
    mocks.useSupplierListQuery.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => useSupplierSearch());
    act(() => result.current.handleSearchQueryChange('nord'));

    expect(result.current.searchResults).toEqual([]);
    expect(result.current.searchLoading).toBe(true);
  });

  it('resets the query', () => {
    const { result } = renderHook(() => useSupplierSearch());

    act(() => result.current.handleSearchQueryChange('ac'));
    expect(result.current.searchQuery).toBe('ac');

    act(() => result.current.resetSearch());
    expect(result.current.searchQuery).toBe('');
  });
});
