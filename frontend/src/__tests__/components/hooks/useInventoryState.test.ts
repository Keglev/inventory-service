/**
 * @file useInventoryState.test.ts
 * @module pages/inventory/hooks/useInventoryState.test
 * 
 * Unit tests for useInventoryState hook.
 * Tests state initialization, setter functions, and state updates.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInventoryState } from '@/pages/inventory/hooks/useInventoryState';

describe('useInventoryState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useInventoryState());

    expect(result.current.q).toBe('');
    expect(result.current.supplierId).toBeNull();
    expect(result.current.belowMinOnly).toBe(false);
    expect(result.current.paginationModel).toEqual({ page: 0, pageSize: 10 });
    expect(result.current.sortModel).toEqual([{ field: 'name', sort: 'asc' }]);
    expect(result.current.selectedId).toBeNull();
    expect(result.current.openNew).toBe(false);
    expect(result.current.openEdit).toBe(false);
    expect(result.current.openEditName).toBe(false);
    expect(result.current.openDelete).toBe(false);
    expect(result.current.openAdjust).toBe(false);
    expect(result.current.openPrice).toBe(false);
  });

  it('should update search query', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setQ('test search');
    });

    expect(result.current.q).toBe('test search');
  });

  it('should update supplierId', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setSupplierId('SUPP123');
    });

    expect(result.current.supplierId).toBe('SUPP123');

    act(() => {
      result.current.setSupplierId(456);
    });

    expect(result.current.supplierId).toBe(456);

    act(() => {
      result.current.setSupplierId(null);
    });

    expect(result.current.supplierId).toBeNull();
  });

  it('should update belowMinOnly filter', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setBelowMinOnly(true);
    });

    expect(result.current.belowMinOnly).toBe(true);

    act(() => {
      result.current.setBelowMinOnly(false);
    });

    expect(result.current.belowMinOnly).toBe(false);
  });

  it('should update pagination model', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setPaginationModel({ page: 2, pageSize: 25 });
    });

    expect(result.current.paginationModel).toEqual({ page: 2, pageSize: 25 });
  });

  it('should update sort model', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setSortModel([{ field: 'onHand', sort: 'desc' }]);
    });

    expect(result.current.sortModel).toEqual([{ field: 'onHand', sort: 'desc' }]);
  });

  it('should update selectedId', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setSelectedId('ITEM123');
    });

    expect(result.current.selectedId).toBe('ITEM123');

    act(() => {
      result.current.setSelectedId(null);
    });

    expect(result.current.selectedId).toBeNull();
  });

  it('should toggle dialog states independently', () => {
    const { result } = renderHook(() => useInventoryState());

    // Test openNew
    act(() => {
      result.current.setOpenNew(true);
    });
    expect(result.current.openNew).toBe(true);
    expect(result.current.openEdit).toBe(false);

    // Test openEdit
    act(() => {
      result.current.setOpenEdit(true);
    });
    expect(result.current.openEdit).toBe(true);
    expect(result.current.openNew).toBe(true);

    // Test openDelete
    act(() => {
      result.current.setOpenDelete(true);
    });
    expect(result.current.openDelete).toBe(true);

    // Test openAdjust
    act(() => {
      result.current.setOpenAdjust(true);
    });
    expect(result.current.openAdjust).toBe(true);

    // Test openPrice
    act(() => {
      result.current.setOpenPrice(true);
    });
    expect(result.current.openPrice).toBe(true);

    // Test openEditName
    act(() => {
      result.current.setOpenEditName(true);
    });
    expect(result.current.openEditName).toBe(true);
  });

  it('should close dialogs independently', () => {
    const { result } = renderHook(() => useInventoryState());

    // Open all dialogs
    act(() => {
      result.current.setOpenNew(true);
      result.current.setOpenEdit(true);
      result.current.setOpenDelete(true);
      result.current.setOpenAdjust(true);
      result.current.setOpenPrice(true);
      result.current.setOpenEditName(true);
    });

    // Close each dialog independently
    act(() => {
      result.current.setOpenNew(false);
    });
    expect(result.current.openNew).toBe(false);
    expect(result.current.openEdit).toBe(true);

    act(() => {
      result.current.setOpenEdit(false);
    });
    expect(result.current.openEdit).toBe(false);
    expect(result.current.openDelete).toBe(true);
  });

  it('should handle multiple state updates in sequence', () => {
    const { result } = renderHook(() => useInventoryState());

    act(() => {
      result.current.setQ('widget');
      result.current.setSupplierId('S100');
      result.current.setBelowMinOnly(true);
      result.current.setPaginationModel({ page: 1, pageSize: 20 });
      result.current.setSortModel([{ field: 'minQty', sort: 'desc' }]);
      result.current.setSelectedId('ITEM999');
    });

    expect(result.current.q).toBe('widget');
    expect(result.current.supplierId).toBe('S100');
    expect(result.current.belowMinOnly).toBe(true);
    expect(result.current.paginationModel).toEqual({ page: 1, pageSize: 20 });
    expect(result.current.sortModel).toEqual([{ field: 'minQty', sort: 'desc' }]);
    expect(result.current.selectedId).toBe('ITEM999');
  });
});
