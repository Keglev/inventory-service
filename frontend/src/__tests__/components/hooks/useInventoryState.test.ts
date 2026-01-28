/**
 * @file useInventoryState.test.ts
 * @module __tests__/components/hooks/useInventoryState
 * @description
 * Enterprise unit tests for `useInventoryState`.
 *
 * This hook owns UI state for Inventory page controls:
 * - filters/search, pagination, sorting
 * - selected row id
 * - dialog open/close flags
 *
 * These tests validate:
 * - default state contract (initial UX configuration)
 * - setters update only the intended slice of state
 * - state updates can be applied in batches (typical UI interactions)
 */

import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useInventoryState } from '@/pages/inventory/hooks/useInventoryState';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function setup() {
  return renderHook(() => useInventoryState());
}

describe('useInventoryState', () => {
  it('initializes with the expected default values', () => {
    const { result } = setup();

    // Defaults are part of the UX contract (initial view on first load).
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

  it('updates q via setQ', () => {
    const { result } = setup();

    act(() => {
      result.current.setQ('test search');
    });

    expect(result.current.q).toBe('test search');
  });

  it('updates supplierId via setSupplierId (string | number | null)', () => {
    const { result } = setup();

    act(() => result.current.setSupplierId('SUPP123'));
    expect(result.current.supplierId).toBe('SUPP123');

    act(() => result.current.setSupplierId(456));
    expect(result.current.supplierId).toBe(456);

    act(() => result.current.setSupplierId(null));
    expect(result.current.supplierId).toBeNull();
  });

  it('updates belowMinOnly via setBelowMinOnly', () => {
    const { result } = setup();

    act(() => result.current.setBelowMinOnly(true));
    expect(result.current.belowMinOnly).toBe(true);

    act(() => result.current.setBelowMinOnly(false));
    expect(result.current.belowMinOnly).toBe(false);
  });

  it('updates paginationModel via setPaginationModel', () => {
    const { result } = setup();

    act(() => {
      result.current.setPaginationModel({ page: 2, pageSize: 25 });
    });

    expect(result.current.paginationModel).toEqual({ page: 2, pageSize: 25 });
  });

  it('updates sortModel via setSortModel', () => {
    const { result } = setup();

    act(() => {
      result.current.setSortModel([{ field: 'onHand', sort: 'desc' }]);
    });

    expect(result.current.sortModel).toEqual([{ field: 'onHand', sort: 'desc' }]);
  });

  it('updates selectedId via setSelectedId', () => {
    const { result } = setup();

    act(() => result.current.setSelectedId('ITEM123'));
    expect(result.current.selectedId).toBe('ITEM123');

    act(() => result.current.setSelectedId(null));
    expect(result.current.selectedId).toBeNull();
  });

  it('toggles each dialog flag independently', () => {
    const { result } = setup();

    type DialogKey =
      | 'openNew'
      | 'openEdit'
      | 'openEditName'
      | 'openDelete'
      | 'openAdjust'
      | 'openPrice';

    const openSetters: Record<DialogKey, (open: boolean) => void> = {
      openNew: result.current.setOpenNew,
      openEdit: result.current.setOpenEdit,
      openEditName: result.current.setOpenEditName,
      openDelete: result.current.setOpenDelete,
      openAdjust: result.current.setOpenAdjust,
      openPrice: result.current.setOpenPrice,
    };

    const keys: DialogKey[] = Object.keys(openSetters) as DialogKey[];

    // Open one dialog at a time and ensure it doesn't implicitly close others.
    act(() => {
      openSetters.openNew(true);
    });
    expect(result.current.openNew).toBe(true);
    expect(result.current.openEdit).toBe(false);

    act(() => {
      openSetters.openEdit(true);
    });
    expect(result.current.openNew).toBe(true);
    expect(result.current.openEdit).toBe(true);

    // Close all and confirm all flags are false (no shared coupling).
    act(() => {
      for (const key of keys) openSetters[key](false);
    });
    for (const key of keys) {
      expect(result.current[key]).toBe(false);
    }
  });

  it('supports batching multiple state updates (typical UI interaction sequence)', () => {
    const { result } = setup();

    act(() => {
      result.current.setQ('widget');
      result.current.setSupplierId('S100');
      result.current.setBelowMinOnly(true);
      result.current.setPaginationModel({ page: 1, pageSize: 20 });
      result.current.setSortModel([{ field: 'minQty', sort: 'desc' }]);
      result.current.setSelectedId('ITEM999');
      result.current.setOpenNew(true);
    });

    expect(result.current.q).toBe('widget');
    expect(result.current.supplierId).toBe('S100');
    expect(result.current.belowMinOnly).toBe(true);

    expect(result.current.paginationModel).toEqual({ page: 1, pageSize: 20 });
    expect(result.current.sortModel).toEqual([{ field: 'minQty', sort: 'desc' }]);

    expect(result.current.selectedId).toBe('ITEM999');
    expect(result.current.openNew).toBe(true);
  });
});
