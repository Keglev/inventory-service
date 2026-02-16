/**
 * @file useDeleteItemHandlers.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/useDeleteItemHandlers
 * @description Unit tests for useDeleteItemHandlers (delete dialog workflow handlers).
 *
 * Contract under test:
 * - handleClose(): resets dialog state and invokes the provided onClose callback.
 * - handleCancelConfirmation(): hides confirmation and shows an informational toast.
 * - onSubmit(): validates selection and toggles confirmation step.
 * - onConfirmedDelete(): validates preconditions, blocks in readOnly mode,
 *   performs deleteItem(), and maps failures into user-facing error messages.
 *
 * Out of scope:
 * - Real React Query behavior (mutations/queries are mocked or treated as inputs)
 * - Network effects beyond asserting deleteItem invocation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { TFunction } from 'i18next';

import type { UseDeleteItemStateReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';
import type { UseDeleteItemQueriesReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import { useDeleteItemHandlers } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const tSpy = vi.hoisted(() => vi.fn((key: string, fallback?: string) => fallback ?? key));
const toastSpy = vi.hoisted(() => vi.fn());
const deleteItemSpy = vi.hoisted(() => vi.fn());
const handleDeleteErrorSpy = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tSpy }),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => toastSpy,
}));

vi.mock('../../../../../api/inventory/mutations', () => ({
  deleteItem: (...args: unknown[]) => deleteItemSpy(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/deleteItemErrorHandler', () => ({
  handleDeleteError: (...args: unknown[]) => handleDeleteErrorSpy(...args),
}));

// -------------------------------------
// Fixtures / helpers
// -------------------------------------
function createQueries(): UseDeleteItemQueriesReturn {
  // Only consumed as a data bag by handlers; exact React Query union shape is out of scope.
  return ({
    suppliersQuery: { data: [], isLoading: false },
    itemsQuery: { data: [], isLoading: false },
    itemDetailsQuery: { data: null, isLoading: false },
  } as unknown) as UseDeleteItemQueriesReturn;
}

function createState(overrides: Partial<UseDeleteItemStateReturn> = {}): UseDeleteItemStateReturn {
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

    // Not exercised directly in this suite; required by type contract.
    handleSubmit: vi.fn((callback: () => Promise<void> | void) => callback),
    reset: vi.fn(),
    resetAll: vi.fn(),
  } as unknown as UseDeleteItemStateReturn;

  return { ...base, ...overrides };
}

type SetupArgs = {
  state?: Partial<UseDeleteItemStateReturn>;
  readOnly?: boolean;
  onClose?: () => void;
  onItemDeleted?: () => void;
};

function setup(args: SetupArgs = {}) {
  const state = createState(args.state);
  const queries = createQueries();
  const onClose = args.onClose ?? vi.fn();
  const onItemDeleted = args.onItemDeleted ?? vi.fn();
  const readOnly = args.readOnly ?? false;

  const hook = renderHook(() => useDeleteItemHandlers(state, queries, onClose, onItemDeleted, readOnly));

  return { state, queries, onClose, onItemDeleted, ...hook };
}

describe('useDeleteItemHandlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic dialog actions', () => {
    it('handleClose resets state and calls onClose', () => {
      const { result, state, onClose, onItemDeleted } = setup();

      act(() => {
        result.current.handleClose();
      });

      expect(state.resetAll).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onItemDeleted).not.toHaveBeenCalled();
    });

    it('handleCancelConfirmation hides confirmation and shows an info toast', () => {
      const { result, state } = setup();

      act(() => {
        result.current.handleCancelConfirmation();
      });

      expect(toastSpy).toHaveBeenCalledWith('Operation cancelled', 'info');
      expect(state.setShowConfirmation).toHaveBeenCalledWith(false);
    });
  });

  describe('submit flow', () => {
    it('onSubmit sets a form error when no item is selected', async () => {
      const { result, state } = setup({ state: { selectedItem: null } });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(state.setFormError).toHaveBeenCalledWith('Please select an item.');
      expect(state.setShowConfirmation).not.toHaveBeenCalledWith(true);
    });

    it('onSubmit opens confirmation when an item is selected', async () => {
      const { result, state } = setup({
        state: { selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'] },
      });

      await act(async () => {
        await result.current.onSubmit();
      });

      expect(state.setShowConfirmation).toHaveBeenCalledWith(true);
    });
  });

  describe('confirmed delete flow', () => {
    it('blocks when no item is selected', async () => {
      const { result, state } = setup({ state: { deletionReason: 'Damaged', selectedItem: null } });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(state.setFormError).toHaveBeenCalledWith('Please select an item.');
      expect(deleteItemSpy).not.toHaveBeenCalled();
    });

    it('blocks when no deletion reason is provided', async () => {
      const { result, state } = setup({
        state: { selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'] },
      });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(state.setFormError).toHaveBeenCalledWith('Please select a deletion reason.');
      expect(deleteItemSpy).not.toHaveBeenCalled();
    });

    it('blocks when readOnly (demo mode)', async () => {
      const { result, state } = setup({
        readOnly: true,
        state: {
          selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'],
          deletionReason: 'Damaged',
        },
      });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(state.setFormError).toHaveBeenCalledWith(
        'You are in demo mode and cannot perform this operation.',
      );
      expect(deleteItemSpy).not.toHaveBeenCalled();
    });

    it('calls deleteItem and closes dialog on success', async () => {
      deleteItemSpy.mockResolvedValue({ ok: true });

      const { result, state, onClose, onItemDeleted } = setup({
        state: {
          selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'],
          deletionReason: 'Damaged',
        },
      });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(deleteItemSpy).toHaveBeenCalledWith('item-1', 'Damaged');
      expect(toastSpy).toHaveBeenCalledWith('Operation successful. Item was removed from inventory!', 'success');

      expect(onItemDeleted).toHaveBeenCalledTimes(1);
      expect(state.resetAll).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('maps API failure response to a user-friendly error and exits confirmation', async () => {
      deleteItemSpy.mockResolvedValue({ ok: false, error: 'Still have stock' });
      handleDeleteErrorSpy.mockReturnValue({ message: 'Friendly error', severity: 'error' });

      const { result, state } = setup({
        state: {
          selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'],
          deletionReason: 'Damaged',
        },
      });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(handleDeleteErrorSpy).toHaveBeenCalledWith('Still have stock', tSpy as unknown as TFunction);
      expect(state.setFormError).toHaveBeenCalledWith('Friendly error');
      expect(state.setShowConfirmation).toHaveBeenCalledWith(false);
    });

    it('shows a fallback error when deleteItem throws', async () => {
      deleteItemSpy.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const { result, state } = setup({
        state: {
          selectedItem: { id: 'item-1', name: 'Item 1' } as unknown as UseDeleteItemStateReturn['selectedItem'],
          deletionReason: 'Damaged',
        },
      });

      await act(async () => {
        await result.current.onConfirmedDelete();
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(state.setFormError).toHaveBeenCalledWith('Failed to delete item. Please try again.');

      consoleSpy.mockRestore();
    });
  });
});
