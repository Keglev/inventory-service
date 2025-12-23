/**
 * @file useSupplierSearch.test.ts
 *
 * @what_is_under_test useSupplierSearch hook
 * @responsibility Manage search query, results, and loading state
 * @out_of_scope Component rendering, API layer details
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../../api/suppliers', () => ({
  getSuppliersPage: vi.fn(),
}));

import { useSupplierSearch } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useSupplierSearch';

describe('useSupplierSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with empty search query', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchQuery).toBe('');
  });

  it('initializes with empty search results', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchResults).toEqual([]);
  });

  it('initializes with not loading state', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.searchLoading).toBe(false);
  });

  it('provides search handler function', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.handleSearchQueryChange).toBeDefined();
  });

  it('provides reset search function', () => {
    const { result } = renderHook(() => useSupplierSearch());
    expect(result.current.resetSearch).toBeDefined();
  });
});
