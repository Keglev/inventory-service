/**
 * @file useTableHandlers.test.ts
 * @module __tests__/pages/inventory/useTableHandlers
 * 
 * @summary
 * Tests for table event handlers hook.
 * Tests handleRowClick, handlePaginationChange, handleSortChange.
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTableHandlers } from '../../../../pages/inventory/handlers/useTableHandlers';
import type { InventoryState, InventoryStateSetters } from '../../../../pages/inventory/hooks/useInventoryState';

describe('useTableHandlers', () => {
  const createMockState = (): InventoryState & InventoryStateSetters => ({
    // State
    q: '',
    supplierId: null,
    belowMinOnly: false,
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    selectedId: null,
    openNew: false,
    openEditName: false,
    openDelete: false,
    openEdit: false,
    openAdjust: false,
    openPrice: false,
    
    // Setters
    setQ: vi.fn(),
    setSupplierId: vi.fn(),
    setBelowMinOnly: vi.fn(),
    setPaginationModel: vi.fn(),
    setSortModel: vi.fn(),
    setSelectedId: vi.fn(),
    setOpenNew: vi.fn(),
    setOpenEditName: vi.fn(),
    setOpenDelete: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenAdjust: vi.fn(),
    setOpenPrice: vi.fn(),
  });

  it('should initialize with all handler functions', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    expect(result.current.handleRowClick).toBeTypeOf('function');
    expect(result.current.handlePaginationChange).toBeTypeOf('function');
    expect(result.current.handleSortChange).toBeTypeOf('function');
  });

  it('should call setSelectedId when handleRowClick is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    result.current.handleRowClick('item-123');

    expect(mockState.setSelectedId).toHaveBeenCalledOnce();
    expect(mockState.setSelectedId).toHaveBeenCalledWith('item-123');
  });

  it('should handle clicking different rows sequentially', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    result.current.handleRowClick('item-1');
    result.current.handleRowClick('item-2');
    result.current.handleRowClick('item-3');

    expect(mockState.setSelectedId).toHaveBeenCalledTimes(3);
    expect(mockState.setSelectedId).toHaveBeenNthCalledWith(1, 'item-1');
    expect(mockState.setSelectedId).toHaveBeenNthCalledWith(2, 'item-2');
    expect(mockState.setSelectedId).toHaveBeenNthCalledWith(3, 'item-3');
  });

  it('should call setPaginationModel when handlePaginationChange is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newModel = { page: 2, pageSize: 25 };
    result.current.handlePaginationChange(newModel);

    expect(mockState.setPaginationModel).toHaveBeenCalledOnce();
    expect(mockState.setPaginationModel).toHaveBeenCalledWith(newModel);
  });

  it('should handle page size changes', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newModel = { page: 0, pageSize: 50 };
    result.current.handlePaginationChange(newModel);

    expect(mockState.setPaginationModel).toHaveBeenCalledWith(newModel);
  });

  it('should handle page number changes', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newModel = { page: 5, pageSize: 10 };
    result.current.handlePaginationChange(newModel);

    expect(mockState.setPaginationModel).toHaveBeenCalledWith(newModel);
  });

  it('should call setSortModel when handleSortChange is invoked', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const newSortModel = [{ field: 'name', sort: 'asc' as const }];
    result.current.handleSortChange(newSortModel);

    expect(mockState.setSortModel).toHaveBeenCalledOnce();
    expect(mockState.setSortModel).toHaveBeenCalledWith(newSortModel);
  });

  it('should handle descending sort', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const descSort = [{ field: 'price', sort: 'desc' as const }];
    result.current.handleSortChange(descSort);

    expect(mockState.setSortModel).toHaveBeenCalledWith(descSort);
  });

  it('should handle multiple sort columns', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    const multiSort = [
      { field: 'name', sort: 'asc' as const },
      { field: 'price', sort: 'desc' as const },
    ];
    result.current.handleSortChange(multiSort);

    expect(mockState.setSortModel).toHaveBeenCalledWith(multiSort);
  });

  it('should handle clearing sort (empty array)', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    result.current.handleSortChange([]);

    expect(mockState.setSortModel).toHaveBeenCalledWith([]);
  });

  it('should memoize handlers to avoid unnecessary re-renders', () => {
    const mockState = createMockState();
    const { result, rerender } = renderHook(() => useTableHandlers(mockState));

    const firstHandlers = result.current;
    rerender();
    const secondHandlers = result.current;

    expect(firstHandlers.handleRowClick).toBe(secondHandlers.handleRowClick);
    expect(firstHandlers.handlePaginationChange).toBe(secondHandlers.handlePaginationChange);
    expect(firstHandlers.handleSortChange).toBe(secondHandlers.handleSortChange);
  });

  it('should handle all table interactions in sequence', () => {
    const mockState = createMockState();
    const { result } = renderHook(() => useTableHandlers(mockState));

    result.current.handleRowClick('item-999');
    result.current.handlePaginationChange({ page: 1, pageSize: 20 });
    result.current.handleSortChange([{ field: 'code', sort: 'asc' as const }]);

    expect(mockState.setSelectedId).toHaveBeenCalledWith('item-999');
    expect(mockState.setPaginationModel).toHaveBeenCalledWith({ page: 1, pageSize: 20 });
    expect(mockState.setSortModel).toHaveBeenCalledWith([{ field: 'code', sort: 'asc' }]);
  });
});
