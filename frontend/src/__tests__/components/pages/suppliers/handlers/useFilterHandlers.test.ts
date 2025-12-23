/**
 * @file useFilterHandlers.test.ts
 * @module __tests__/components/pages/suppliers/handlers/useFilterHandlers
 *
 * @summary
 * Test suite for useFilterHandlers hook.
 * Tests: filter toggle handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilterHandlers } from '../../../../../pages/suppliers/handlers/useFilterHandlers';
import type { UseSuppliersBoardStateReturn } from '../../../../../pages/suppliers/hooks/useSuppliersBoardState';

describe('useFilterHandlers', () => {
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
    const { result } = renderHook(() => useFilterHandlers(state));

    // Assert
    expect(result.current).toHaveProperty('handleToggleShowAll');
    expect(typeof result.current.handleToggleShowAll).toBe('function');
  });

  it('handleToggleShowAll should update showAllSuppliers state to true', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useFilterHandlers(state));

    // Act
    result.current.handleToggleShowAll(true);

    // Assert
    expect(state.setShowAllSuppliers).toHaveBeenCalledWith(true);
  });

  it('handleToggleShowAll should update showAllSuppliers state to false', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useFilterHandlers(state));

    // Act
    result.current.handleToggleShowAll(false);

    // Assert
    expect(state.setShowAllSuppliers).toHaveBeenCalledWith(false);
  });

  it('should accept state parameter and use its setters', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { result } = renderHook(() => useFilterHandlers(state));

    // Assert
    expect(result.current).toBeDefined();
    result.current.handleToggleShowAll(true);
    expect(state.setShowAllSuppliers).toHaveBeenCalled();
  });

  it('should call setShowAllSuppliers with correct value', () => {
    // Arrange
    const state = createMockState();

    const { result } = renderHook(() => useFilterHandlers(state));

    // Act
    result.current.handleToggleShowAll(true);
    result.current.handleToggleShowAll(false);
    result.current.handleToggleShowAll(true);

    // Assert
    expect(state.setShowAllSuppliers).toHaveBeenCalledTimes(3);
    expect(state.setShowAllSuppliers).toHaveBeenNthCalledWith(1, true);
    expect(state.setShowAllSuppliers).toHaveBeenNthCalledWith(2, false);
    expect(state.setShowAllSuppliers).toHaveBeenNthCalledWith(3, true);
  });
});
