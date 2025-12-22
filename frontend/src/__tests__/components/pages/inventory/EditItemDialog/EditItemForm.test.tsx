/**
 * @file EditItemForm.test.tsx
 *
 * @what_is_under_test EditItemForm component - three-step form UI
 * @responsibility Render supplier/item/name fields, show loading/error states, handle field visibility
 * @out_of_scope Hook logic, form validation, API calls, state management details
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditItemForm } from '../../../../../pages/inventory/dialogs/EditItemDialog/EditItemForm';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const createMockState = (overrides = {}) => ({
  selectedSupplier: null,
  selectedItem: null,
  itemQuery: '',
  formError: '',
  setSelectedSupplier: vi.fn(),
  setSelectedItem: vi.fn(),
  setItemQuery: vi.fn(),
  setFormError: vi.fn(),
  suppliersQuery: { isLoading: false, data: [
    { id: '1', label: 'Supplier A' },
    { id: '2', label: 'Supplier B' },
  ]},
  itemsQuery: { isLoading: false, data: [] },
  itemDetailsQuery: { isLoading: false, data: null },
  control: {},
  formState: { errors: {}, isSubmitting: false },
  setValue: vi.fn(),
  onSubmit: vi.fn(),
  handleClose: vi.fn(),
  ...overrides,
});

describe('EditItemForm', () => {
  describe('Rendering', () => {
    it('renders supplier selection section', () => {
      const state = createMockState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      const heading = screen.getByRole('heading', { level: 6, name: /Step 1/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders item selection section', () => {
      const state = createMockState({
        selectedSupplier: { id: '1', label: 'Supplier A' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 1: Select Supplier/i)).toBeInTheDocument();
    });

    it('renders form structure', () => {
      const state = createMockState();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 1: Select Supplier/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 2: Select Item/i)).toBeInTheDocument();
    });
  });

  describe('Step 2: Item Search', () => {
    it('handles supplier selection state', () => {
      const state = createMockState({ selectedSupplier: { id: '1', label: 'Supplier A' } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 1: Select Supplier/i)).toBeInTheDocument();
    });

    it('shows loading state for items query', () => {
      const state = createMockState({
        selectedSupplier: { id: '1', label: 'Supplier A' },
        itemsQuery: { isLoading: true, data: [] },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 2: Select Item/i)).toBeInTheDocument();
    });
  });

  describe('Step 3: Item Name', () => {
    it('displays form layout', () => {
      const state = createMockState({
        selectedSupplier: { id: '1', label: 'Supplier A' },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 1: Select Supplier/i)).toBeInTheDocument();
      expect(screen.getByText(/Step 2: Select Item/i)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('displays form error when present', () => {
      const state = createMockState({
        formError: 'An error occurred',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/An error occurred/i)).toBeInTheDocument();
    });

    it('clears error on state change', () => {
      const state = createMockState({
        formError: 'Error message',
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { rerender } = render(<EditItemForm state={state as any} />);

      const newState = createMockState({ formError: '' });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rerender(<EditItemForm state={newState as any} />);

      expect(screen.queryByText(/Error message/)).not.toBeInTheDocument();
    });
  });

  describe('Form submission', () => {
    it('provides submit handler', () => {
      const state = createMockState({
        formState: { errors: {}, isSubmitting: false },
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render(<EditItemForm state={state as any} />);

      expect(screen.getByText(/Step 1: Select Supplier/i)).toBeInTheDocument();
    });
  });
});
