/**
 * @file useDeleteItemDialog.test.ts
 * @module __tests__/components/pages/inventory/DeleteItemDialog/useDeleteItemDialog
 * @description Composition tests for useDeleteItemDialog.
 *
 * Contract:
 * - Composes state (useDeleteItemState), queries (useDeleteItemQueries), and handlers (useDeleteItemHandlers).
 * - Forwards dialogOpen / onClose / onItemDeleted / readOnly to sub-hooks with correct argument mapping.
 * - Passes selectedItem?.id into queries and omits it when no item is selected.
 *
 * Notes:
 * - We do not re-create full React Query UseQueryResult unions (too heavy and out of scope).
 *   Instead we cast minimal stable shapes to the expected types to test wiring only.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import type { UseDeleteItemStateReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState';
import type { UseDeleteItemQueriesReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries';
import type { UseDeleteItemHandlersReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers';

import { useDeleteItemDialog } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemDialog';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockUseDeleteItemState = vi.hoisted(() => vi.fn());
const mockUseDeleteItemQueries = vi.hoisted(() => vi.fn());
const mockUseDeleteItemHandlers = vi.hoisted(() => vi.fn());

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemState', () => ({
  useDeleteItemState: (...args: unknown[]) => mockUseDeleteItemState(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemQueries', () => ({
  useDeleteItemQueries: (...args: unknown[]) => mockUseDeleteItemQueries(...args),
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemHandlers', () => ({
  useDeleteItemHandlers: (...args: unknown[]) => mockUseDeleteItemHandlers(...args),
}));

// -------------------------------------
// Helpers
// -------------------------------------

/**
 * Minimal query result helper for composition tests.
 * We only care that the returned object reference is passed through.
 */
function asQueryResult<T>(data: T): UseQueryResult<T, Error> {
  return ({ data } as unknown) as UseQueryResult<T, Error>;
}

type HookArgs = {
  dialogOpen: boolean;
  onClose: () => void;
  onItemDeleted: () => void;
  readOnly?: boolean;
};

function renderUseDeleteItemDialog(args: HookArgs) {
  return renderHook(
    (props: HookArgs) =>
      useDeleteItemDialog(props.dialogOpen, props.onClose, props.onItemDeleted, props.readOnly),
    { initialProps: args },
  );
}

describe('useDeleteItemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('composes state, queries, and handlers into the dialog contract (wiring)', () => {
    const onClose = vi.fn();
    const onItemDeleted = vi.fn();

    // We intentionally keep fixtures minimal and cast once at the mock boundary.
    const state = ({
      selectedSupplier: { id: 'supplier-1', label: 'Supplier 1' }, // SupplierOption shape is domain-defined
      selectedItem: { id: 'item-1', name: 'Item 1' },
      itemQuery: 'gloves',
      deletionReason: 'Damaged',
    } as unknown) as UseDeleteItemStateReturn;

    const queries = ({
      suppliersQuery: asQueryResult([{ id: 'supplier-1', label: 'Supplier 1' }]),
      itemsQuery: asQueryResult([{ id: 'item-1', name: 'Item 1' }]),
      itemDetailsQuery: asQueryResult(null),
    } as unknown) as UseDeleteItemQueriesReturn;

    const handlers = ({
      handleClose: vi.fn(),
      handleCancelConfirmation: vi.fn(),
      onSubmit: vi.fn(),
      onConfirmedDelete: vi.fn(),
    } as unknown) as UseDeleteItemHandlersReturn;

    mockUseDeleteItemState.mockReturnValue(state);
    mockUseDeleteItemQueries.mockReturnValue(queries);
    mockUseDeleteItemHandlers.mockReturnValue(handlers);

    const { result } = renderUseDeleteItemDialog({
      dialogOpen: true,
      onClose,
      onItemDeleted,
      readOnly: false,
    });

    // Pass-through contract: the composed hook exposes the same references from sub-hooks.
    expect(result.current.selectedSupplier).toBe(state.selectedSupplier);
    expect(result.current.selectedItem).toBe(state.selectedItem);
    expect(result.current.deletionReason).toBe(state.deletionReason);

    expect(result.current.suppliersQuery).toBe(queries.suppliersQuery);
    expect(result.current.itemsQuery).toBe(queries.itemsQuery);
    expect(result.current.itemDetailsQuery).toBe(queries.itemDetailsQuery);

    expect(result.current.handleClose).toBe(handlers.handleClose);
    expect(result.current.onSubmit).toBe(handlers.onSubmit);
    expect(result.current.onConfirmedDelete).toBe(handlers.onConfirmedDelete);

    // Delegation contract: verify sub-hook argument wiring.
    expect(mockUseDeleteItemState).toHaveBeenCalledTimes(1);

    expect(mockUseDeleteItemQueries).toHaveBeenCalledWith(
      true,
      state.selectedSupplier,
      state.itemQuery,
      state.selectedItem?.id,
    );

    expect(mockUseDeleteItemHandlers).toHaveBeenCalledWith(
      state,
      queries,
      onClose,
      onItemDeleted,
      false,
    );
  });

  it('passes readOnly through to handlers', () => {
    const state = ({ selectedSupplier: null, selectedItem: null, itemQuery: '' } as unknown) as UseDeleteItemStateReturn;
    const queries = ({
      suppliersQuery: asQueryResult([]),
      itemsQuery: asQueryResult([]),
      itemDetailsQuery: asQueryResult(null),
    } as unknown) as UseDeleteItemQueriesReturn;
    const handlers = ({ onSubmit: vi.fn() } as unknown) as UseDeleteItemHandlersReturn;

    mockUseDeleteItemState.mockReturnValue(state);
    mockUseDeleteItemQueries.mockReturnValue(queries);
    mockUseDeleteItemHandlers.mockReturnValue(handlers);

    renderUseDeleteItemDialog({
      dialogOpen: false,
      onClose: vi.fn(),
      onItemDeleted: vi.fn(),
      readOnly: true,
    });

    expect(mockUseDeleteItemHandlers).toHaveBeenCalledWith(
      state,
      queries,
      expect.any(Function),
      expect.any(Function),
      true,
    );
  });

  it('omits itemId when no item is selected', () => {
    const state = ({
      selectedSupplier: { id: 'supplier-1', label: 'Supplier 1' },
      selectedItem: null,
      itemQuery: 'gloves',
    } as unknown) as UseDeleteItemStateReturn;

    const queries = ({
      suppliersQuery: asQueryResult([]),
      itemsQuery: asQueryResult([]),
      itemDetailsQuery: asQueryResult(null),
    } as unknown) as UseDeleteItemQueriesReturn;

    const handlers = ({} as unknown) as UseDeleteItemHandlersReturn;

    mockUseDeleteItemState.mockReturnValue(state);
    mockUseDeleteItemQueries.mockReturnValue(queries);
    mockUseDeleteItemHandlers.mockReturnValue(handlers);

    renderUseDeleteItemDialog({
      dialogOpen: true,
      onClose: vi.fn(),
      onItemDeleted: vi.fn(),
    });

    expect(mockUseDeleteItemQueries).toHaveBeenCalledWith(
      true,
      state.selectedSupplier,
      state.itemQuery,
      undefined,
    );
  });
});
