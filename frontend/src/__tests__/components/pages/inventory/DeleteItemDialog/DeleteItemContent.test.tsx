/**
 * @file DeleteItemContent.test.tsx
 * @module __tests__/components/pages/inventory/DeleteItemDialog/DeleteItemContent
 * @description Unit tests for DeleteItemContent rendering logic.
 *
 * Contract under test:
 * - Renders the form view by default (showConfirmation=false).
 * - Renders the confirmation view when showConfirmation=true.
 * - Surfaces a validation/error message when state.formError is provided.
 *
 * Out of scope:
 * - Hook/state orchestration (handled by the dialog container/hook tests).
 * - Network/React Query behavior (this component is render-only).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { DeleteItemContent } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemContent';
import type { UseDeleteItemDialogReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';

const createMockState = (
  overrides: Partial<UseDeleteItemDialogReturn> = {},
): UseDeleteItemDialogReturn => {
  const baseState: UseDeleteItemDialogReturn = {
    selectedSupplier: null,
    selectedItem: null,
    deletionReason: '',
    formError: '',
    itemQuery: '',
    showConfirmation: false,
    isSubmitting: false,
    suppliersQuery: ({ data: [], isLoading: false } as unknown) as UseDeleteItemDialogReturn['suppliersQuery'],
    itemsQuery: ({ data: [], isLoading: false } as unknown) as UseDeleteItemDialogReturn['itemsQuery'],
    itemDetailsQuery: ({ data: null, isLoading: false } as unknown) as UseDeleteItemDialogReturn['itemDetailsQuery'],
    setItemQuery: vi.fn(),
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setDeletionReason: vi.fn(),
    setFormError: vi.fn(),
    setShowConfirmation: vi.fn(),
    handleClose: vi.fn(),
    handleCancelConfirmation: vi.fn(),
    onSubmit: vi.fn(),
    onConfirmedDelete: vi.fn(),
  };

  return { ...baseState, ...overrides };
};

function renderDeleteItemContent(
  opts: { showConfirmation: boolean; state?: UseDeleteItemDialogReturn } = { showConfirmation: false },
) {
  const state = opts.state ?? createMockState();
  return render(<DeleteItemContent state={state} showConfirmation={opts.showConfirmation} />);
}

describe('DeleteItemContent', () => {
  it('renders the form view when showConfirmation is false', () => {
    renderDeleteItemContent({ showConfirmation: false });

    expect(screen.getByText('Step 1: Select Supplier')).toBeInTheDocument();
    expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument();
  });

  it('renders the confirmation view when showConfirmation is true', () => {
    const state = createMockState({
      selectedItem: { id: 'item1', name: 'Item 1' } as UseDeleteItemDialogReturn['selectedItem'],
      itemDetailsQuery: ({
        data: { name: 'Item 1', onHand: 3 },
        isLoading: false,
      } as unknown) as UseDeleteItemDialogReturn['itemDetailsQuery'],
    });

    renderDeleteItemContent({ showConfirmation: true, state });

    expect(screen.getByText('This action cannot be undone!')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByText('Item being deleted:')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders a form error message when state.formError is present', () => {
    const state = createMockState({ formError: 'Test error' });

    renderDeleteItemContent({ showConfirmation: false, state });

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('switches between views based on showConfirmation', () => {
    const state = createMockState({
      selectedItem: { id: 'item1', name: 'Item 1' } as UseDeleteItemDialogReturn['selectedItem'],
      itemDetailsQuery: ({
        data: { name: 'Item 1', onHand: 3 },
        isLoading: false,
      } as unknown) as UseDeleteItemDialogReturn['itemDetailsQuery'],
    });

    const { rerender } = render(<DeleteItemContent state={state} showConfirmation={false} />);

    expect(screen.getByText('Step 1: Select Supplier')).toBeInTheDocument();
    expect(screen.queryByText('Are you sure you want to proceed?')).not.toBeInTheDocument();

    rerender(<DeleteItemContent state={state} showConfirmation />);

    expect(screen.queryByText('Step 1: Select Supplier')).not.toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });
});
