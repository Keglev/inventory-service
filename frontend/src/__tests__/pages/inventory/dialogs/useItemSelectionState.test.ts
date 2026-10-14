/**
 * @file useItemSelectionState.test.ts
 * @module __tests__/pages/inventory/dialogs/useItemSelectionState
 * @testing useItemSelectionState
 * @description The shared selection state of the item dialogs starts empty, with
 *   an empty string as "no error", and each setter updates only its own value.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useItemSelectionState } from '@/pages/inventory/dialogs/useItemSelectionState';

describe('useItemSelectionState', () => {
  it('starts with no supplier, no item, no query and an empty error', () => {
    const { result } = renderHook(() => useItemSelectionState());

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.itemQuery).toBe('');
    expect(result.current.formError).toBe('');
  });

  it('updates each value through its own setter', () => {
    const { result } = renderHook(() => useItemSelectionState());
    const supplier = { id: 's1', label: 'Supplier 1' };
    const item = { id: 'i1', name: 'Item 1', supplierId: 's1' };

    act(() => result.current.setSelectedSupplier(supplier));
    expect(result.current.selectedSupplier).toEqual(supplier);
    expect(result.current.selectedItem).toBeNull();

    act(() => result.current.setSelectedItem(item));
    act(() => result.current.setItemQuery('Ite'));
    act(() => result.current.setFormError('boom'));

    expect(result.current).toMatchObject({
      selectedSupplier: supplier,
      selectedItem: item,
      itemQuery: 'Ite',
      formError: 'boom',
    });
  });
});
