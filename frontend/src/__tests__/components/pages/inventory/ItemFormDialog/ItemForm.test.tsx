/**
 * @file ItemForm.test.tsx
 *
 * @what_is_under_test ItemForm component
 * @responsibility Render form fields for item creation/editing
 * @out_of_scope Form validation, submission logic
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ItemForm } from '../../../../../pages/inventory/dialogs/ItemFormDialog/ItemForm';
import type { UseItemFormReturn } from '../../../../../pages/inventory/dialogs/ItemFormDialog/useItemForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

const createMockState = (overrides: Partial<UseItemFormReturn> = {}): UseItemFormReturn => {
  const baseState: UseItemFormReturn = {
    supplierValue: null,
    formError: null,
    setSupplierValue: vi.fn(),
    setFormError: vi.fn(),
    suppliers: [],
    register: vi.fn(),
    control: {} as unknown as UseItemFormReturn['control'],
    formState: {
      errors: {},
      isSubmitting: false,
    } as unknown as UseItemFormReturn['formState'],
    setValue: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    watch: vi.fn() as unknown as UseItemFormReturn['watch'],
    handleSubmit: vi.fn(),
    onSubmit: vi.fn(),
    handleClose: vi.fn(),
  };
  return { ...baseState, ...overrides };
};

describe('ItemForm', () => {
  it('renders form for create mode', () => {
    const state = createMockState();
    const { container } = render(<ItemForm state={state} initial={undefined} />);
    expect(container).toBeTruthy();
  });

  it('renders form for edit mode', () => {
    const state = createMockState({
      supplierValue: { id: '1', label: 'Supplier A' },
    });
    const initial = {
      id: 'item1',
      name: 'Test Item',
      code: 'TEST001',
      onHand: 100,
      updatedAt: new Date().toISOString(),
    };
    const { container } = render(<ItemForm state={state} initial={initial} />);
    expect(container).toBeTruthy();
  });

  it('displays form error message', () => {
    const state = createMockState({
      formError: 'Form submission failed',
    });
    const { container } = render(<ItemForm state={state} initial={undefined} />);
    expect(container.textContent).toContain('Form submission failed');
  });

  it('renders with suppliers list', () => {
    const state = createMockState({
      suppliers: [
        { id: '1', label: 'Supplier A' },
        { id: '2', label: 'Supplier B' },
      ],
    });
    const { container } = render(<ItemForm state={state} initial={undefined} />);
    expect(container).toBeTruthy();
  });
});
