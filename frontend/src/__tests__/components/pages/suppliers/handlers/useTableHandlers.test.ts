/**
 * @file useTableHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useTableHandlers
 *
 * @summary
 * Test suite for useTableHandlers hook.
 * Tests: row click selection, pagination changes, sort changes.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableHandlers } from '../../../../../pages/suppliers/handlers/useTableHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useTableHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockState = (): UseSuppliersBoardStateReturn => ({
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
  });

  it('should return handler functions', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { result } = renderHook(() => useTableHandlers(state));

    // Assert
    expect(result.current).toHaveProperty('handleRowClick');
    expect(result.current).toHaveProperty('handlePaginationChange');
    expect(result.current).toHaveProperty('handleSortChange');
    expect(typeof result.current.handleRowClick).toBe('function');
    expect(typeof result.current.handlePaginationChange).toBe('function');
    expect(typeof result.current.handleSortChange).toBe('function');
  });

  it('handleRowClick should select row by id', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handleRowClick({ id: '123' });

    // Assert
    expect(state.setSelectedId).toHaveBeenCalledWith('123');
  });

  it('handleRowClick should convert numeric id to string', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handleRowClick({ id: 456 });

    // Assert
    expect(state.setSelectedId).toHaveBeenCalledWith('456');
  });

  it('handlePaginationChange should update pagination model', () => {
    // Arrange
    const state = createMockState();

    const newPaginationModel = { page: 2, pageSize: 25 };
    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handlePaginationChange(newPaginationModel);

    // Assert
    expect(state.setPaginationModel).toHaveBeenCalledWith(newPaginationModel);
  });

  it('handleSortChange should update sort model', () => {
    // Arrange
    const state = createMockState();

    const newSortModel = [{ field: 'name', sort: 'desc' as const }];
    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handleSortChange(newSortModel);

    // Assert
    expect(state.setSortModel).toHaveBeenCalledWith(newSortModel);
  });

  it('handlePaginationChange should handle pageSize change', () => {
    // Arrange
    const state = createMockState();

    const newPaginationModel = { page: 0, pageSize: 50 };
    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handlePaginationChange(newPaginationModel);

    // Assert
    expect(state.setPaginationModel).toHaveBeenCalledWith(newPaginationModel);
  });

  it('handleSortChange should handle empty sort model', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useTableHandlers(state));

    // Act
    result.current.handleSortChange([]);

    // Assert
    expect(state.setSortModel).toHaveBeenCalledWith([]);
  });

  it('should accept state parameter and use its setters', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { result } = renderHook(() => useTableHandlers(state));

    // Assert
    expect(result.current).toBeDefined();
    result.current.handleRowClick({ id: '1' });
    expect(state.setSelectedId).toHaveBeenCalled();
  });
});
