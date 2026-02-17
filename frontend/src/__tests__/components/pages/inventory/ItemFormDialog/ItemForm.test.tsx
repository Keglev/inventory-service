/**
 * @file ItemForm.test.tsx
 * @module __tests__/components/pages/inventory/ItemFormDialog/ItemForm
 * @description Contract tests for ItemForm:
 * - Renders all expected fields for create and edit modes
 * - Shows generic form error banner when present
 * - Reason dropdown is create-only (hidden when editing an existing item)
 *
 * Out of scope:
 * - RHF validation rules and submission workflow
 * - Autocomplete interaction details (MUI internals)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ItemForm } from '../../../../../pages/inventory/dialogs/ItemFormDialog/ItemForm';
import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Prefer fallback/default strings for stable tests across locales.
    t: (_key: string, fallback?: string) => fallback ?? _key,
  }),
}));

function createMockState(overrides: Partial<UseItemFormReturn> = {}): UseItemFormReturn {
  const baseState: UseItemFormReturn = {
    supplierValue: null,
    formError: null,
    setSupplierValue: vi.fn(),
    setFormError: vi.fn(),
    suppliers: [],

    // register() must return RHF field props consumed by TextField
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

    /**
     * RHF watch is an overloaded callable type. A plain vi.fn() does not structurally
     * match all overloads, so we provide a callable stub and cast via unknown.
     *
     * ItemForm reads: watch('reason') ?? 'INITIAL_STOCK'
     */
    watch: (((name?: unknown) => {
      if (name === 'reason') return 'INITIAL_STOCK';
      return undefined;
    }) as unknown) as UseItemFormReturn['watch'],

    handleSubmit: vi.fn(),
    onSubmit: vi.fn(),
    handleClose: vi.fn(),
  };

  return { ...baseState, ...overrides };
}

function renderItemForm(state: UseItemFormReturn, initial?: unknown) {
  return render(<ItemForm state={state} initial={initial as never} />);
}

describe('ItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all base fields in create mode (including Reason)', () => {
    const state = createMockState({
      suppliers: [
        { id: 'sup-1', label: 'Supplier A' },
        { id: 'sup-2', label: 'Supplier B' },
      ],
    });

    renderItemForm(state, undefined);

    // Base fields
    expect(screen.getByLabelText('Supplier')).toBeInTheDocument();
    expect(screen.getByLabelText('Item')).toBeInTheDocument();
    expect(screen.getByLabelText('Code / SKU')).toBeInTheDocument();
    expect(screen.getByLabelText('Initial Stock')).toBeInTheDocument();
    expect(screen.getByLabelText('Price')).toBeInTheDocument();

    // Create-only reason dropdown
    expect(screen.getByLabelText('Reason')).toBeInTheDocument();
  });

  it('hides Reason dropdown in edit mode (initial has id)', () => {
    const state = createMockState();

    const initial = {
      id: 'item-1',
      name: 'Existing Item',
      code: 'EX-001',
      onHand: 10,
      updatedAt: new Date().toISOString(),
    };

    renderItemForm(state, initial);

    expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument();
  });

  it('renders a generic error banner when formError is set', () => {
    const state = createMockState({ formError: 'Form submission failed' });

    renderItemForm(state, undefined);

    // ItemForm uses MUI <Alert>, but we assert on user-visible text to avoid MUI internals.
    expect(screen.getByText('Form submission failed')).toBeInTheDocument();
  });

  it('renders supplier autocomplete with provided supplier options', () => {
    const state = createMockState({
      suppliers: [
        { id: 'sup-1', label: 'Supplier A' },
        { id: 'sup-2', label: 'Supplier B' },
      ],
    });

    renderItemForm(state, undefined);

    // We do not test Autocomplete popup behavior here; just that the control exists.
    // Supplier option rendering/popups are MUI internals.
    expect(screen.getByLabelText('Supplier')).toBeInTheDocument();
  });
});
