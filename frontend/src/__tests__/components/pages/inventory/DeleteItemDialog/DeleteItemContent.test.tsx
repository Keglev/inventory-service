/**
 * @file DeleteItemContent.test.tsx
 *
 * @what_is_under_test DeleteItemContent component
 * @responsibility Render form or confirmation view
 * @out_of_scope State management, hooks
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DeleteItemContent } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemContent';
import type { UseDeleteItemDialogReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';

vi.mock('../../../../../api/inventory/hooks/useInventoryData.ts');

const createMockState = (overrides: Partial<UseDeleteItemDialogReturn> = {}): UseDeleteItemDialogReturn => {
  const baseState: UseDeleteItemDialogReturn = {
    selectedSupplier: null,
    selectedItem: null,
    deletionReason: '',
    formError: '',
    itemQuery: '',
    showConfirmation: false,
    isSubmitting: false,
    suppliersQuery: {} as unknown as UseDeleteItemDialogReturn['suppliersQuery'],
    itemsQuery: {} as unknown as UseDeleteItemDialogReturn['itemsQuery'],
    itemDetailsQuery: {} as unknown as UseDeleteItemDialogReturn['itemDetailsQuery'],
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

describe('DeleteItemContent', () => {
  it('renders form view', () => {
    const state = createMockState();
    const { container } = render(
      <DeleteItemContent state={state} showConfirmation={false} />
    );
    expect(container).toBeTruthy();
  });

  it('renders confirmation view', () => {
    const state = createMockState({
      selectedSupplier: { id: '1', label: 'Supplier A' },
      selectedItem: { id: 'item1', name: 'Item 1' },
    });
    const { container } = render(
      <DeleteItemContent state={state} showConfirmation={true} />
    );
    expect(container).toBeTruthy();
  });

  it('displays form error message', () => {
    const state = createMockState({ formError: 'Test error' });
    const { container } = render(
      <DeleteItemContent state={state} showConfirmation={false} />
    );
    expect(container.textContent).toContain('Test error');
  });

  it('switches between form and confirmation', () => {
    const state = createMockState({
      selectedSupplier: { id: '1', label: 'Supplier A' },
      selectedItem: { id: 'item1', name: 'Item 1' },
    });
    const { rerender, container } = render(
      <DeleteItemContent state={state} showConfirmation={false} />
    );
    const formHTML = container.innerHTML;

    rerender(
      <DeleteItemContent state={state} showConfirmation={true} />
    );
    const confirmHTML = container.innerHTML;

    expect(formHTML).not.toEqual(confirmHTML);
  });
});
