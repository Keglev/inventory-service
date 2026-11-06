/**
 * @file EditItemDialog.test.tsx
 * @module __tests__/pages/inventory/dialogs/EditItemDialog/EditItemDialog
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

import { EditItemDialog } from '@/pages/inventory/dialogs/EditItemDialog/EditItemDialog';
import * as useEditItemFormModule from '@/pages/inventory/dialogs/EditItemDialog/useEditItemForm';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/pages/inventory/dialogs/EditItemDialog/useEditItemForm');

const mockEditItemForm = vi.hoisted(() => vi.fn());
vi.mock('@/pages/inventory/dialogs/EditItemDialog/EditItemForm', () => ({
  EditItemForm: () => {
    mockEditItemForm();
    return <div data-testid="edit-item-form">Form Component</div>;
  },
}));

vi.mock('@/hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // tEn resolves keys against the real English locale files.
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
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

    expect(screen.getByText(/Edit Item/i)).toBeInTheDocument();

    expect(screen.getByTestId('edit-item-form')).toBeInTheDocument();
    expect(mockEditItemForm).toHaveBeenCalledTimes(1);
  });

  it('hands readOnly to the hook, false when not given', () => {
    const onClose = vi.fn();
    const onItemRenamed = vi.fn();
    const { rerender } = render(<EditItemDialog open onClose={onClose} onItemRenamed={onItemRenamed} />);
    expect(useEditItemFormModule.useEditItemForm).toHaveBeenLastCalledWith(true, onClose, onItemRenamed, false);

    rerender(<EditItemDialog open onClose={onClose} onItemRenamed={onItemRenamed} readOnly />);
    expect(useEditItemFormModule.useEditItemForm).toHaveBeenLastCalledWith(true, onClose, onItemRenamed, true);
  });

  it('delegates close action to hook handleClose', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    vi.mocked(useEditItemFormModule.useEditItemForm).mockReturnValue(
      createHookReturn({ handleClose }),
    );

    render(<EditItemDialog open onClose={vi.fn()} onItemRenamed={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('shows the saving label with a spinner and disables actions while submitting', () => {
    vi.mocked(useEditItemFormModule.useEditItemForm).mockReturnValue(
      createHookReturn({
        formState: {
          isSubmitting: true,
          errors: {},
        } as EditItemFormHookReturn['formState'],
      }),
    );

    render(<EditItemDialog open onClose={vi.fn()} onItemRenamed={vi.fn()} />);

    expect(screen.getByText(tEn('common:actions.saving'))).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });
});
