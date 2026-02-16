/**
 * @file DeleteItemDialog.test.tsx
 * @module __tests__/components/pages/inventory/DeleteItemDialog/DeleteItemDialog
 * @description Wrapper-level tests for DeleteItemDialog.
 *
 * Contract under test:
 * - When open=true, renders the dialog content container.
 * - When open=false, does not render dialog content.
 * - Delegates state/handlers to useDeleteItemDialog and passes the result into DeleteItemContent.
 *
 * Out of scope:
 * - DeleteItemContent rendering details (tested separately).
 * - Hook internal logic (tested in hook-level tests).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { HelpProvider } from '../../../../../context/help/HelpContext';
import { DeleteItemDialog } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog';
import type { UseDeleteItemDialogReturn } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog.types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const mockUseDeleteItemDialog = vi.hoisted(() => vi.fn());

// Capture the props passed into DeleteItemContent for assertions.
const mockDeleteItemContent = vi.hoisted(() => vi.fn());

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemContent', () => ({
  DeleteItemContent: (props: unknown) => {
    mockDeleteItemContent(props);
    return <div data-testid="delete-item-content">Content</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemDialog', () => ({
  useDeleteItemDialog: (...args: unknown[]) => mockUseDeleteItemDialog(...args),
}));

// -------------------------------------
// Helpers
// -------------------------------------
function createMockState(
  overrides: Partial<UseDeleteItemDialogReturn> = {},
): UseDeleteItemDialogReturn {
  const base: UseDeleteItemDialogReturn = {
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

  return { ...base, ...overrides };
}

function renderDialog(props?: Partial<React.ComponentProps<typeof DeleteItemDialog>>) {
  const defaultProps: React.ComponentProps<typeof DeleteItemDialog> = {
    open: true,
    onClose: vi.fn(),
    onItemDeleted: vi.fn(),
  };

  const mergedProps = { ...defaultProps, ...props };

  return {
    rendered: render(
      <HelpProvider>
        <DeleteItemDialog {...mergedProps} />
      </HelpProvider>,
    ),
    props: mergedProps,
  };
}

describe('DeleteItemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDeleteItemDialog.mockReturnValue(createMockState());
  });

  it('renders dialog content when open=true', () => {
    renderDialog({ open: true });

    expect(screen.getByTestId('delete-item-content')).toBeInTheDocument();
    expect(mockUseDeleteItemDialog).toHaveBeenCalled();
    expect(mockDeleteItemContent).toHaveBeenCalledTimes(1);
    expect(mockDeleteItemContent).toHaveBeenLastCalledWith(
      expect.objectContaining({ showConfirmation: false }),
    );
  });

  it('does not render dialog content when open=false', () => {
    renderDialog({ open: false });

    // MUI dialogs typically unmount children when closed; this is the contract we test here.
    expect(screen.queryByTestId('delete-item-content')).not.toBeInTheDocument();
  });

  it('passes the hook state into DeleteItemContent', () => {
    const state = createMockState({
      showConfirmation: true,
      formError: 'Example error',
    });

    mockUseDeleteItemDialog.mockReturnValue(state);

    renderDialog({ open: true });

    const passedStates = mockDeleteItemContent.mock.calls.map((call) => call[0] as {
      state: UseDeleteItemDialogReturn;
      showConfirmation: boolean;
    });

    passedStates.forEach(({ state: receivedState }) => {
      expect(receivedState).toBe(state);
    });
    expect(passedStates).toHaveLength(1);
    expect(passedStates[0]).toEqual(expect.objectContaining({ showConfirmation: true }));
  });

  it('wires onClose into the hook call (delegation boundary)', () => {
    const onClose = vi.fn();
    const onItemDeleted = vi.fn();

    const { props } = renderDialog({ open: true, onClose, onItemDeleted, readOnly: true });

    expect(mockUseDeleteItemDialog).toHaveBeenCalledWith(
      props.open,
      onClose,
      onItemDeleted,
      true,
    );
  });
});
