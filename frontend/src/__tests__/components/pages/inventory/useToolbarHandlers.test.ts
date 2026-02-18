/**
 * @file useToolbarHandlers.test.ts
 * @module __tests__/components/pages/inventory/useToolbarHandlers
 * @description Contract tests for `useToolbarHandlers`:
 * - Toolbar actions open the expected dialogs via InventoryState setters.
 *
 * Out of scope:
 * - Dialog components themselves (tested separately).
 */

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToolbarHandlers } from '../../../../pages/inventory/handlers/useToolbarHandlers';
import { makeInventoryState } from './fixtures';

describe('useToolbarHandlers', () => {
  it('returns the expected handlers', () => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    expect(result.current.handleAddNew).toBeTypeOf('function');
    expect(result.current.handleEdit).toBeTypeOf('function');
    expect(result.current.handleDelete).toBeTypeOf('function');
    expect(result.current.handleAdjustQty).toBeTypeOf('function');
    expect(result.current.handleChangePrice).toBeTypeOf('function');
  });

  it.each([
    ['handleAddNew', 'setOpenNew'],
    ['handleEdit', 'setOpenEditName'],
    ['handleDelete', 'setOpenDelete'],
    ['handleAdjustQty', 'setOpenAdjust'],
    ['handleChangePrice', 'setOpenPrice'],
  ] as const)('%s opens the expected dialog', (handlerName, setterName) => {
    const mockState = makeInventoryState();
    const { result } = renderHook(() => useToolbarHandlers(mockState));

    result.current[handlerName]();

    expect(mockState[setterName]).toHaveBeenCalledWith(true);
  });
});
