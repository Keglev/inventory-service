/**
 * @file ItemFormDialog.test.tsx
 * @module __tests__/components/pages/inventory/ItemFormDialog/ItemFormDialog
 * @description Contract tests for ItemFormDialog:
 * - Renders the create title and action labels.
 * - Wires dialog props into useItemForm and passes state into ItemForm.
 * - Forwards readOnly (demo mode) to useItemForm.
 * - Calls state.onSubmit once when the primary action is clicked.
 * - Calls state.handleClose on cancel.
 * - Shows progress and disables actions while submitting.
 * - Opens the create-item help topic via HelpIconButton.
 *
 * Out of scope:
 * - useItemForm internals (validation, mutations, toast)
 * - ItemForm field-level rendering (covered in ItemForm.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';
import { ItemFormDialog } from '../../../../../pages/inventory/dialogs/ItemFormDialog/ItemFormDialog';
import { tEn } from '../../../../test/i18nEn';

// -------------------------------------
// Deterministic / hoisted mocks
// -------------------------------------
const itemFormPropsSpy = vi.hoisted(() => vi.fn());
const useItemFormMock = vi.hoisted(() => vi.fn());
const helpButtonPropsSpy = vi.hoisted(() => vi.fn());
const openHelpMock = vi.hoisted(() => vi.fn());

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/ItemForm', () => ({
  ItemForm: (props: unknown) => {
    itemFormPropsSpy(props);
    return <div data-testid="item-form">Mocked ItemForm</div>;
  },
}));

vi.mock('../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm', () => ({
  useItemForm: (...args: unknown[]) => useItemFormMock(...args),
}));

vi.mock('../../../../../features/help/components/HelpIconButton', () => ({
  HelpIconButton: (props: { topicId: string; tooltip?: string }) => {
    helpButtonPropsSpy(props);
    return (
      <button
        type="button"
        aria-label="Open help"
        onClick={() => openHelpMock(props.topicId)}
      />
    );
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer fallback strings for stable assertions.
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

/**
 * Build a minimal UseItemFormReturn state object that satisfies ItemFormDialog expectations.
 * Keep this aligned with how ItemFormDialog interacts with the hook return.
 */
function createState(overrides: Partial<UseItemFormReturn> = {}): UseItemFormReturn {
  const base: UseItemFormReturn = {
    supplierValue: null,
    formError: null,
    setSupplierValue: vi.fn(),
    setFormError: vi.fn(),
    suppliers: [],

    // RHF surface used by ItemForm (and indirectly by dialog submit wiring)
    register: vi.fn((name: string) => ({
      name,
      onChange: vi.fn(),
      onBlur: vi.fn(),
      ref: vi.fn(),
    })) as UseItemFormReturn['register'],

    control: {} as UseItemFormReturn['control'],
    formState: { errors: {}, isSubmitting: false } as UseItemFormReturn['formState'],
    setValue: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),

    // watch() is an overloaded callable type; provide a callable stub.
    watch: ((() => undefined) as unknown) as UseItemFormReturn['watch'],

    onSubmit: vi.fn(),
    handleClose: vi.fn(),
  };

  return { ...base, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ItemFormDialog', () => {
  it('renders the create title and calls state.onSubmit once', async () => {
    const user = userEvent.setup();

    const state = createState({ onSubmit: vi.fn() });

    useItemFormMock.mockReturnValue(state);

    const onClose = vi.fn();
    const onSaved = vi.fn();

    render(<ItemFormDialog isOpen={true} onClose={onClose} onSaved={onSaved} />);

    // Title + primary action label
    // WHY: the labeled help button inside DialogTitle contributes to the heading's accessible name.
    expect(screen.getByRole('heading', { name: /Create Item/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    // The hook already wraps onSubmit with handleSubmit: the dialog must not wrap it again.
    expect(state.onSubmit).toHaveBeenCalledTimes(1);

    // Dialog passes hook state down to the form
    expect(itemFormPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ state }),
    );

    // Hook called with dialog contract
    expect(useItemFormMock).toHaveBeenCalledWith({
      isOpen: true,
      onClose,
      onSaved,
    });
  });

  it('forwards readOnly to useItemForm when readOnly is set', () => {
    useItemFormMock.mockReturnValue(createState());

    render(<ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} readOnly />);

    expect(useItemFormMock).toHaveBeenCalledWith(
      expect.objectContaining({ readOnly: true }),
    );
  });

  it('calls state.handleClose when Cancel is clicked', async () => {
    const user = userEvent.setup();

    const handleCloseSpy = vi.fn();
    const state = createState({
      handleClose: handleCloseSpy,
      formState: { errors: {}, isSubmitting: false } as UseItemFormReturn['formState'],
    });

    useItemFormMock.mockReturnValue(state);

    render(
      <ItemFormDialog
        isOpen={true}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(handleCloseSpy).toHaveBeenCalledTimes(1);
  });

  it('shows progress indicator and disables actions while submitting', () => {
    const state = createState({
      formState: { errors: {}, isSubmitting: true } as UseItemFormReturn['formState'],
    });

    useItemFormMock.mockReturnValue(state);

    render(<ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('opens the create-item help topic', async () => {
    const user = userEvent.setup();

    useItemFormMock.mockReturnValue(createState());

    render(<ItemFormDialog isOpen={true} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(helpButtonPropsSpy).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'inventory.manage' }),
    );

    await user.click(screen.getByRole('button', { name: 'Open help' }));
    expect(openHelpMock).toHaveBeenCalledWith('inventory.manage');
  });
});
