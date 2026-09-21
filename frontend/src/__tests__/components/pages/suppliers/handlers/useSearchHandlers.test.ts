/**
 * @file useSearchHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useSearchHandlers
 * @description Contract tests for `useSearchHandlers`.
 *
 * Contract under test:
 * - `handleSearchChange(query)`:
 *   - updates search query
 *   - clears selection (search result + row id)
 *   - resets pagination to first page while preserving pageSize
 * - `handleSearchResultSelect(supplier)`:
 *   - sets selected supplier and selectedId
 *   - sets searchQuery to the supplier's name (string)
 *   - resets pagination to first page while preserving pageSize
 * - `handleClearSearchSelection()` clears selection and search query.
 *
 * Out of scope:
 * - Search dropdown rendering, debouncing, or API integration.
 * - Edge cases not representable by the current domain types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSearchHandlers } from '../../../../../pages/suppliers/handlers/useSearchHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';
import type { SupplierRow } from '../../../../../api/suppliers/types';

describe('useSearchHandlers', () => {
  const supplierRow = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
    id: 'supplier-1',
    name: 'Acme Corp',
    ...overrides,
  });

  const createState = (overrides: Partial<UseSuppliersBoardStateReturn> = {}): UseSuppliersBoardStateReturn => ({
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    searchQuery: '',
    showAllSuppliers: false,
    selectedId: null,
    selectedSearchResult: null,
    openCreate: false,
    openEdit: false,
    openDelete: false,
    setOpenCreate: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenDelete: vi.fn(),
    setSearchQuery: vi.fn(),
    setSelectedSearchResult: vi.fn(),
    setSelectedId: vi.fn(),
    setPaginationModel: vi.fn(),
    setSortModel: vi.fn(),
    setShowAllSuppliers: vi.fn(),
    ...overrides,
  });

  const renderHandlers = (state: UseSuppliersBoardStateReturn) =>
    renderHook(() => useSearchHandlers(state)).result.current;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns its handler functions', () => {
    const handlers = renderHandlers(createState());
    expect(handlers).toEqual(
      expect.objectContaining({
        handleSearchChange: expect.any(Function),
        handleSearchResultSelect: expect.any(Function),
        handleClearSearchSelection: expect.any(Function),
      })
    );
  });

  it('updates the query and resets the selection when the search changes', () => {
    const state = createState({
      paginationModel: { page: 2, pageSize: 10 },
      selectedId: '123',
      selectedSearchResult: supplierRow({ id: '123', name: 'Acme Corp' }),
    });
    const handlers = renderHandlers(state);

    handlers.handleSearchChange('acme');

    // Assert
    expect(state.setSearchQuery).toHaveBeenCalledWith('acme');
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
    expect(state.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('selects the result and updates the query when a search result is chosen', () => {
    const supplier = supplierRow({ id: '123', name: 'Acme Corp' });
    const state = createState({ paginationModel: { page: 1, pageSize: 10 } });
    const handlers = renderHandlers(state);

    // Orchestration-only: verify setters receive the correct supplier-derived values.
    handlers.handleSearchResultSelect(supplier);

    // Assert
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(supplier);
    expect(state.setSelectedId).toHaveBeenCalledWith('123');
    expect(state.setSearchQuery).toHaveBeenCalledWith('Acme Corp');
    expect(state.setPaginationModel).toHaveBeenCalledWith({ page: 0, pageSize: 10 });
  });

  it('clears all search state when the search selection is cleared', () => {
    const state = createState({
      selectedId: '123',
      searchQuery: 'acme',
      selectedSearchResult: supplierRow({ id: '123', name: 'Acme Corp' }),
    });
    const handlers = renderHandlers(state);

    handlers.handleClearSearchSelection();

    // Assert
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
  });

  it('accepts an empty query when the search changes', () => {
    const state = createState({ paginationModel: { page: 1, pageSize: 10 }, selectedId: '123', searchQuery: 'test' });
    const handlers = renderHandlers(state);

    handlers.handleSearchChange('');

    expect(state.setSearchQuery).toHaveBeenCalledWith('');
    expect(state.setSelectedSearchResult).toHaveBeenCalledWith(null);
    expect(state.setSelectedId).toHaveBeenCalledWith(null);
  });

  it('accepts a supplier with an empty name when a search result is chosen', () => {
    const state = createState();
    const handlers = renderHandlers(state);

    handlers.handleSearchResultSelect(supplierRow({ id: '456', name: '' }));

    expect(state.setSelectedId).toHaveBeenCalledWith('456');
    expect(state.setSearchQuery).toHaveBeenCalledWith('');
  });
});
