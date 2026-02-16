/**
 * @file useDeleteItemState.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/useDeleteItemState
 * @description Unit tests for useDeleteItemState (delete dialog local state + form sync).
 *
 * Contract under test:
 * - Initializes default dialog state (no supplier/item selected, empty inputs, no errors).
 * - Changing supplier clears dependent fields (selected item, search query, errors, confirmation state)
 *   and synchronizes the form field itemId.
 * - Selecting an item syncs itemId into react-hook-form via setValue().
 * - resetAll() clears UI state and calls react-hook-form reset().
 *
 * Out of scope:
 * - Zod schema correctness
 * - react-hook-form internal behavior (we only verify our interaction contract)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useDeleteItemState } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';

// -------------------------------------
// Deterministic mocks
// -------------------------------------
const useFormMock = vi.hoisted(() => vi.fn());

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => ({})),
}));

vi.mock('react-hook-form', () => ({
  useForm: (...args: unknown[]) => useFormMock(...args),
}));

// -------------------------------------
// Helpers
// -------------------------------------
function createFormStub(overrides?: Partial<{
  handleSubmit: unknown;
  formState: { isSubmitting: boolean };
  reset: ReturnType<typeof vi.fn>;
  setValue: ReturnType<typeof vi.fn>;
}>) {
  const stub = {
    handleSubmit: vi.fn(() => vi.fn()),
    formState: { isSubmitting: false },
    reset: vi.fn(),
    setValue: vi.fn(),
    ...overrides,
  };

  return stub;
}

describe('useDeleteItemState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes dialog state with defaults', () => {
    const formStub = createFormStub();
    useFormMock.mockReturnValue(formStub);

    const { result } = renderHook(() => useDeleteItemState());

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.itemQuery).toBe('');
    expect(result.current.deletionReason).toBe('');
    expect(result.current.formError).toBe('');
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.isSubmitting).toBe(false);

    // Form contract: handleSubmit is delegated to react-hook-form.
    expect(result.current.handleSubmit).toBe(formStub.handleSubmit);
  });

  it('resets dependent state when supplier changes', async () => {
    const setValue = vi.fn();
    const formStub = createFormStub({ setValue });
    useFormMock.mockReturnValue(formStub);

    const { result } = renderHook(() => useDeleteItemState());

    await act(async () => {
      result.current.setSelectedItem({ id: 'item-1', name: 'Item 1' });
      result.current.setItemQuery('gloves');
      result.current.setFormError('error');
      result.current.setShowConfirmation(true);
    });

    await act(async () => {
      result.current.setSelectedSupplier({ id: 'supplier-1', label: 'Supplier 1' });
    });

    expect(result.current.selectedItem).toBeNull();
    expect(result.current.itemQuery).toBe('');
    expect(result.current.formError).toBe('');
    expect(result.current.showConfirmation).toBe(false);

    // Form sync: supplier change clears selected item id in the form model.
    expect(setValue).toHaveBeenCalledWith('itemId', '');
  });

  it('syncs selected item id to form state', async () => {
    const setValue = vi.fn();
    const formStub = createFormStub({ setValue });
    useFormMock.mockReturnValue(formStub);

    const { result } = renderHook(() => useDeleteItemState());

    await act(async () => {
      result.current.setSelectedItem({ id: 'item-2', name: 'Item 2' });
    });

    expect(setValue).toHaveBeenCalledWith('itemId', 'item-2');
  });

  it('resetAll clears selections and triggers form reset', async () => {
    const reset = vi.fn();
    const formStub = createFormStub({ reset });
    useFormMock.mockReturnValue(formStub);

    const { result } = renderHook(() => useDeleteItemState());

    await act(async () => {
      result.current.setSelectedSupplier({ id: 'supplier-4', label: 'Supplier 4' });
      result.current.setSelectedItem({ id: 'item-4', name: 'Item 4' });
      result.current.setItemQuery('mask');
      result.current.setFormError('error');
      result.current.setShowConfirmation(true);
      result.current.setDeletionReason('Damaged');

      result.current.resetAll();
    });

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.itemQuery).toBe('');
    expect(result.current.formError).toBe('');
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.deletionReason).toBe('');

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
