/**
 * @file useDeleteItemDialog.test.ts
 *
 * @what_is_under_test useDeleteItemDialog hook composition
 * @responsibility Combine state, queries, and handlers into dialog contract
 * @out_of_scope Internal implementations of sub-hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { UseDeleteItemStateReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';
import type { UseDeleteItemQueriesReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import type { UseDeleteItemHandlersReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers';

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState', () => ({
  useDeleteItemState: vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries', () => ({
  useDeleteItemQueries: vi.fn(),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers', () => ({
  useDeleteItemHandlers: vi.fn(),
}));

import { useDeleteItemState } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';
import { useDeleteItemQueries } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import { useDeleteItemHandlers } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers';
import { useDeleteItemDialog } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemDialog';

// Helper: build state stub returned by useDeleteItemState
const createStateMock = (): UseDeleteItemStateReturn => ({
  selectedSupplier: { id: 'supplier-1', label: 'Supplier 1' },
  setSelectedSupplier: vi.fn(),
  selectedItem: { id: 'item-1', name: 'Item 1' },
  setSelectedItem: vi.fn(),
  itemQuery: 'gloves',
  setItemQuery: vi.fn(),
  deletionReason: 'Damaged',
  setDeletionReason: vi.fn(),
  formError: '',
  setFormError: vi.fn(),
  showConfirmation: false,
  setShowConfirmation: vi.fn(),
  isSubmitting: false,
  handleSubmit: vi.fn(),
  reset: vi.fn(),
  resetAll: vi.fn(),
} as unknown as UseDeleteItemStateReturn);

// Helper: build queries stub returned by useDeleteItemQueries
const createQueriesMock = (): UseDeleteItemQueriesReturn => ({
  suppliersQuery: { data: ['Supplier 1'] },
  itemsQuery: { data: [] },
  itemDetailsQuery: { data: null },
} as unknown as UseDeleteItemQueriesReturn);

// Helper: build handlers stub returned by useDeleteItemHandlers
const createHandlersMock = (): UseDeleteItemHandlersReturn => ({
  handleClose: vi.fn(),
  handleCancelConfirmation: vi.fn(),
  onSubmit: vi.fn(),
  onConfirmedDelete: vi.fn(),
} as unknown as UseDeleteItemHandlersReturn);

type HookProps = {
  dialogOpen: boolean;
  onClose: () => void;
  onItemDeleted: () => void;
  readOnly?: boolean;
};

const useDeleteItemStateMock = vi.mocked(useDeleteItemState);
const useDeleteItemQueriesMock = vi.mocked(useDeleteItemQueries);
const useDeleteItemHandlersMock = vi.mocked(useDeleteItemHandlers);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useDeleteItemDialog', () => {
  it('combines state, queries, and handlers into unified contract', () => {
    const state = createStateMock();
    const queries = createQueriesMock();
    const handlers = createHandlersMock();
    const onClose = vi.fn();
    const onItemDeleted = vi.fn();

    useDeleteItemStateMock.mockReturnValue(state);
    useDeleteItemQueriesMock.mockReturnValue(queries);
    useDeleteItemHandlersMock.mockReturnValue(handlers);

    const { result } = renderHook(
      (props: HookProps) =>
        useDeleteItemDialog(props.dialogOpen, props.onClose, props.onItemDeleted, props.readOnly),
      {
        initialProps: { dialogOpen: true, onClose, onItemDeleted, readOnly: false },
      }
    );

    expect(result.current.selectedSupplier).toBe(state.selectedSupplier);
    expect(result.current.selectedItem).toBe(state.selectedItem);
    expect(result.current.deletionReason).toBe(state.deletionReason);
    expect(result.current.suppliersQuery).toBe(queries.suppliersQuery);
    expect(result.current.itemsQuery).toBe(queries.itemsQuery);
    expect(result.current.itemDetailsQuery).toBe(queries.itemDetailsQuery);
    expect(result.current.handleClose).toBe(handlers.handleClose);
    expect(result.current.onSubmit).toBe(handlers.onSubmit);
    expect(result.current.onConfirmedDelete).toBe(handlers.onConfirmedDelete);

    expect(useDeleteItemStateMock).toHaveBeenCalledTimes(1);
    expect(useDeleteItemQueriesMock).toHaveBeenCalledWith(
      true,
      state.selectedSupplier,
      state.itemQuery,
      state.selectedItem?.id
    );
    expect(useDeleteItemHandlersMock).toHaveBeenCalledWith(
      state,
      queries,
      onClose,
      onItemDeleted,
      false
    );
  });

  it('passes readOnly flag through to handlers', () => {
    const state = createStateMock();
    const queries = createQueriesMock();
    const handlers = createHandlersMock();

    useDeleteItemStateMock.mockReturnValue(state);
    useDeleteItemQueriesMock.mockReturnValue(queries);
    useDeleteItemHandlersMock.mockReturnValue(handlers);

    const { result } = renderHook(
      (props: HookProps) =>
        useDeleteItemDialog(props.dialogOpen, props.onClose, props.onItemDeleted, props.readOnly),
      {
        initialProps: { dialogOpen: false, onClose: vi.fn(), onItemDeleted: vi.fn(), readOnly: true },
      }
    );

    expect(result.current.onSubmit).toBe(handlers.onSubmit);
    expect(useDeleteItemQueriesMock).toHaveBeenCalledWith(false, state.selectedSupplier, state.itemQuery, 'item-1');
    expect(useDeleteItemHandlersMock).toHaveBeenCalledWith(
      state,
      queries,
      expect.any(Function),
      expect.any(Function),
      true
    );
  });

  it('omits item id when no item selected', () => {
    const state = createStateMock();
    state.selectedItem = null;
    const queries = createQueriesMock();
    const handlers = createHandlersMock();

    useDeleteItemStateMock.mockReturnValue(state);
    useDeleteItemQueriesMock.mockReturnValue(queries);
    useDeleteItemHandlersMock.mockReturnValue(handlers);

    renderHook(
      (props: HookProps) =>
        useDeleteItemDialog(props.dialogOpen, props.onClose, props.onItemDeleted, props.readOnly),
      {
        initialProps: { dialogOpen: true, onClose: vi.fn(), onItemDeleted: vi.fn() },
      }
    );

    expect(useDeleteItemQueriesMock).toHaveBeenCalledWith(
      true,
      state.selectedSupplier,
      state.itemQuery,
      undefined
    );
  });
});

