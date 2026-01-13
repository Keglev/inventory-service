/**
 * @file useDeleteItemHandlers.test.ts
 *
 * @what_is_under_test useDeleteItemHandlers hook
 * @responsibility Provide event handlers and API workflow for delete dialog
 * @out_of_scope React Query integration, actual API network effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { UseDeleteItemStateReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';
import type { UseDeleteItemQueriesReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import { useDeleteItemHandlers } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers';

const tMock = vi.fn((key: string, fallback?: string) => (fallback as string | undefined) ?? key);
const toastMock = vi.fn();
const deleteItemMock = vi.fn();
const handleDeleteErrorMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => toastMock,
}));

vi.mock('../../../../../api/inventory/mutations', () => ({
  deleteItem: (...args: unknown[]) => deleteItemMock(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler', () => ({
  handleDeleteError: (...args: unknown[]) => handleDeleteErrorMock(...args),
}));

// Helper: build minimal query object required by hook
const createQueries = (): UseDeleteItemQueriesReturn =>
  ({
    suppliersQuery: { data: [], isLoading: false },
    itemsQuery: { data: [], isLoading: false },
    itemDetailsQuery: { data: null, isLoading: false },
  } as unknown as UseDeleteItemQueriesReturn);

// Helper: build state stub with vitest spies for assertions
const createState = (
  overrides: Partial<UseDeleteItemStateReturn> = {}
): UseDeleteItemStateReturn => {
  const handleSubmit: UseDeleteItemStateReturn['handleSubmit'] = (onValid) => {
    return async (...args: unknown[]) => {
      await onValid({ itemId: '' } as unknown as Parameters<typeof onValid>[0], args[0] as never);
    };
  };

  const base = {
    selectedSupplier: null,
    setSelectedSupplier: vi.fn(),
    selectedItem: null,
    setSelectedItem: vi.fn(),
    itemQuery: '',
    setItemQuery: vi.fn(),
    deletionReason: '',
    setDeletionReason: vi.fn(),
    formError: '',
    setFormError: vi.fn(),
    showConfirmation: false,
    setShowConfirmation: vi.fn(),
    isSubmitting: false,
    handleSubmit,
    reset: vi.fn(),
    resetAll: vi.fn(),
  } as unknown as UseDeleteItemStateReturn;

  return { ...base, ...overrides } as UseDeleteItemStateReturn;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDeleteItemHandlers', () => {
  it('handleClose resets state and runs onClose callback', () => {
    const state = createState();
    const onClose = vi.fn();
    const onItemDeleted = vi.fn();

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), onClose, onItemDeleted)
    );

    act(() => {
      result.current.handleClose();
    });

    expect(state.resetAll).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onItemDeleted).not.toHaveBeenCalled();
  });

  it('handleCancelConfirmation hides confirmation and shows toast', () => {
    const state = createState();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), onClose, vi.fn())
    );

    act(() => {
      result.current.handleCancelConfirmation();
    });

    expect(toastMock).toHaveBeenCalledWith('Operation cancelled', 'info');
    expect(state.setShowConfirmation).toHaveBeenCalledWith(false);
  });

  it('onSubmit sets form error when no item selected', async () => {
    const state = createState();
    const onClose = vi.fn();

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), onClose, vi.fn())
    );

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(state.setFormError).toHaveBeenCalledWith('Please select an item.');
    expect(state.setShowConfirmation).not.toHaveBeenCalledWith(true);
  });

  it('onSubmit opens confirmation when item selected', async () => {
    const state = createState({ selectedItem: { id: 'item-1', name: 'Item 1' } });

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn())
    );

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(state.setShowConfirmation).toHaveBeenCalledWith(true);
  });

  it('onConfirmedDelete blocks without selected item', async () => {
    const state = createState({ deletionReason: 'Damaged' });

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn())
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(state.setFormError).toHaveBeenCalledWith('Please select an item.');
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it('onConfirmedDelete blocks without deletion reason', async () => {
    const state = createState({ selectedItem: { id: 'item-1', name: 'Item 1' } });

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn())
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(state.setFormError).toHaveBeenCalledWith('Please select a deletion reason.');
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it('onConfirmedDelete blocks when readOnly', async () => {
    const state = createState({
      selectedItem: { id: 'item-1', name: 'Item 1' },
      deletionReason: 'Damaged',
    });

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn(), true)
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(state.setFormError).toHaveBeenCalledWith(
      'You are in demo mode and cannot perform this operation.'
    );
    expect(deleteItemMock).not.toHaveBeenCalled();
  });

  it('onConfirmedDelete calls API and closes dialog on success', async () => {
    deleteItemMock.mockResolvedValue({ ok: true });
    const state = createState({
      selectedItem: { id: 'item-1', name: 'Item 1' },
      deletionReason: 'Damaged',
    });
    const onClose = vi.fn();
    const onItemDeleted = vi.fn();

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), onClose, onItemDeleted)
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(deleteItemMock).toHaveBeenCalledWith('item-1', 'Damaged');
    expect(toastMock).toHaveBeenCalledWith(
      'Operation successful. Item was removed from inventory!',
      'success'
    );
    expect(onItemDeleted).toHaveBeenCalledTimes(1);
    expect(state.resetAll).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('onConfirmedDelete uses mapped error message when API returns failure', async () => {
    deleteItemMock.mockResolvedValue({ ok: false, error: 'Still have stock' });
    handleDeleteErrorMock.mockReturnValue({ message: 'Friendly error', severity: 'error' });
    const state = createState({
      selectedItem: { id: 'item-1', name: 'Item 1' },
      deletionReason: 'Damaged',
    });

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn())
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(handleDeleteErrorMock).toHaveBeenCalledWith('Still have stock', tMock);
    expect(state.setFormError).toHaveBeenCalledWith('Friendly error');
    expect(state.setShowConfirmation).toHaveBeenCalledWith(false);
  });

  it('onConfirmedDelete shows fallback error when API throws', async () => {
    deleteItemMock.mockRejectedValue(new Error('Network error'));
    const state = createState({
      selectedItem: { id: 'item-1', name: 'Item 1' },
      deletionReason: 'Damaged',
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() =>
      useDeleteItemHandlers(state, createQueries(), vi.fn(), vi.fn())
    );

    await act(async () => {
      await result.current.onConfirmedDelete();
    });

    expect(consoleSpy).toHaveBeenCalled();
    expect(state.setFormError).toHaveBeenCalledWith(
      'Failed to delete item. Please try again.'
    );

    consoleSpy.mockRestore();
  });
});
