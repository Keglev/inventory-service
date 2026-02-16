/**
 * @file EditItemDialog.test.tsx
 * @module __tests__/components/pages/inventory/EditItemDialog/EditItemDialog
 * @description Wrapper-level tests for the EditItemDialog container.
 *
 * Contract under test:
 * - When open=false, dialog content is not rendered.
 * - When open=true, dialog renders with a title and mounts EditItemForm.
 * - Close action delegates to the form hook's handleClose (dialog container boundary).
 *
 * Out of scope:
 * - Form validation rules and react-hook-form behavior
 * - API calls and mutations
 * - Supplier/item search behavior (handled in hook/form tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditItemDialog } from '../../../../../pages/inventory/dialogs/EditItemDialog/EditItemDialog';
import * as useEditItemFormModule from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';

// -------------------------------------
// Deterministic mocks
// -------------------------------------

vi.mock('../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm');

const mockEditItemForm = vi.hoisted(() => vi.fn());
vi.mock('../../../../../pages/inventory/dialogs/EditItemDialog/EditItemForm', () => ({
  EditItemForm: () => {
    mockEditItemForm();
    return <div data-testid="edit-item-form">Form Component</div>;
  },
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer defaultValue when provided; otherwise return key.
    t: (key: string, defaultValue?: string) => defaultValue ?? key,
  }),
}));

type EditItemFormHookReturn = ReturnType<typeof useEditItemFormModule.useEditItemForm>;

function createHookReturn(
  overrides: Partial<EditItemFormHookReturn> = {},
): EditItemFormHookReturn {
  // Minimal contract surface required by EditItemDialog + EditItemForm boundary.
  return {
    selectedSupplier: null,
    selectedItem: null,
    itemQuery: '',
    formError: '',
    setSelectedSupplier: vi.fn(),
    setSelectedItem: vi.fn(),
    setItemQuery: vi.fn(),
    setFormError: vi.fn(),
    suppliersQuery: { isLoading: false, data: [] } as unknown as EditItemFormHookReturn['suppliersQuery'],
    itemsQuery: { isLoading: false, data: [] } as unknown as EditItemFormHookReturn['itemsQuery'],
    itemDetailsQuery: { isLoading: false, data: null } as unknown as EditItemFormHookReturn['itemDetailsQuery'],
    control: {} as EditItemFormHookReturn['control'],
    formState: { isSubmitting: false, errors: {} } as EditItemFormHookReturn['formState'],
    setValue: vi.fn(),
    onSubmit: vi.fn(),
    handleClose: vi.fn(),
    ...overrides,
  } as EditItemFormHookReturn;
}

describe('EditItemDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useEditItemFormModule.useEditItemForm).mockReturnValue(createHookReturn());
  });

  it('renders nothing when closed (open=false)', () => {
    render(<EditItemDialog open={false} onClose={vi.fn()} onItemRenamed={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders dialog, title, and form when open=true', () => {
    render(<EditItemDialog open onClose={vi.fn()} onItemRenamed={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Title is a stable UI contract; this assumes component uses a defaultValue like "Edit Item".
    // If the dialog uses only i18n keys, adjust assertion to that key.
    expect(screen.getByText(/Edit Item/i)).toBeInTheDocument();

    expect(screen.getByTestId('edit-item-form')).toBeInTheDocument();
    expect(mockEditItemForm).toHaveBeenCalledTimes(1);
  });

  it('delegates close action to hook handleClose', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.mocked(useEditItemFormModule.useEditItemForm).mockReturnValue(
      createHookReturn({ handleClose }),
    );

    render(<EditItemDialog open onClose={vi.fn()} onItemRenamed={vi.fn()} />);

    // Prefer accessible close/cancel button if present.
    const closeButton =
      screen.queryByRole('button', { name: /close|cancel/i }) ??
      screen.queryByLabelText(/close|cancel/i);

    if (!closeButton) {
      // If your dialog uses an IconButton without accessible name,
      // the component should be fixed—but we keep the test resilient.
      throw new Error('Close button is missing an accessible name (close/cancel).');
    }

    await user.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
