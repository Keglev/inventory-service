/**
 * @file useDeleteItemState.test.ts
 *
 * @what_is_under_test useDeleteItemState hook
 * @responsibility Manage delete dialog selection and form state
 * @out_of_scope zod schema validation, react-hook-form internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDeleteItemState } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';

const useFormMock = vi.fn();

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: vi.fn(() => ({})),
}));

vi.mock('react-hook-form', () => ({
  useForm: (...args: unknown[]) => useFormMock(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDeleteItemState', () => {
  it('initializes dialog state with defaults', () => {
    const setValueMock = vi.fn();
    const resetMock = vi.fn();
    const formStub = {
      handleSubmit: vi.fn(() => vi.fn()),
      formState: { isSubmitting: false },
      reset: resetMock,
      setValue: setValueMock,
    };

    useFormMock.mockImplementation(() => formStub);

    const { result } = renderHook(() => useDeleteItemState());

    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.selectedItem).toBeNull();
    expect(result.current.itemQuery).toBe('');
    expect(result.current.deletionReason).toBe('');
    expect(result.current.formError).toBe('');
    expect(result.current.showConfirmation).toBe(false);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.handleSubmit).toBe(formStub.handleSubmit);
  });

  it('resets dependent state when supplier changes', async () => {
    const setValueMock = vi.fn();
    const resetMock = vi.fn();
    const formStub = {
      handleSubmit: vi.fn(() => vi.fn()),
      formState: { isSubmitting: false },
      reset: resetMock,
      setValue: setValueMock,
    };

    useFormMock.mockImplementation(() => formStub);

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
    expect(setValueMock).toHaveBeenCalledWith('itemId', '');
  });

  it('syncs selected item id to form state', async () => {
    const setValueMock = vi.fn();
    const formStub = {
      handleSubmit: vi.fn(() => vi.fn()),
      formState: { isSubmitting: false },
      reset: vi.fn(),
      setValue: setValueMock,
    };

    useFormMock.mockImplementation(() => formStub);

    const { result } = renderHook(() => useDeleteItemState());

    await act(async () => {
      result.current.setSelectedItem({ id: 'item-2', name: 'Item 2' });
    });

    expect(setValueMock).toHaveBeenCalledWith('itemId', 'item-2');
  });

  it('resetAll clears selections and triggers form reset', async () => {
    const resetMock = vi.fn();
    const formStub = {
      handleSubmit: vi.fn(() => vi.fn()),
      formState: { isSubmitting: false },
      reset: resetMock,
      setValue: vi.fn(),
    };

    useFormMock.mockImplementation(() => formStub);

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
    expect(resetMock).toHaveBeenCalledTimes(1);
  });
});
