/**
 * @file EditItemDialog.test.tsx
 *
 * @what_is_under_test EditItemDialog component - main dialog UI container
 * @responsibility Render dialog layout, manage title/buttons, handle close actions
 * @out_of_scope Form state management, API calls, validation logic, supplier/item selection
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditItemDialog } from '../../../../../pages/inventory/dialogs/EditItemDialog/EditItemDialog';
import * as useEditItemFormModule from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';

// Mock dependencies
vi.mock('../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm');

vi.mock('../../../../../pages/inventory/dialogs/EditItemDialog/EditItemForm', () => ({
  EditItemForm: () => <div data-testid="form">Form Component</div>,
}));

vi.mock('../../../../../hooks/useHelp', () => ({
  useHelp: () => ({ openHelp: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

const mockFormState = {
  isSubmitting: false,
  errors: {},
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = any;

const createMockFormReturn = (overrides: Record<string, AnyFn> = {}) => ({
  selectedSupplier: null,
  selectedItem: null,
  itemQuery: '',
  formError: '',
  setSelectedSupplier: vi.fn(),
  setSelectedItem: vi.fn(),
  setItemQuery: vi.fn(),
  setFormError: vi.fn(),
  suppliersQuery: { isLoading: false, data: [] },
  itemsQuery: { isLoading: false, data: [] },
  itemDetailsQuery: { isLoading: false, data: null },
  control: {},
  formState: mockFormState,
  setValue: vi.fn(),
  onSubmit: vi.fn(),
  handleClose: vi.fn(),
  ...overrides,
});

describe('EditItemDialog', () => {
  beforeEach(() => {
    vi.mocked(useEditItemFormModule.useEditItemForm).mockReturnValue(
      createMockFormReturn() as any  // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  });

  describe('Dialog rendering', () => {
    it('renders nothing when closed', () => {
      const { container } = render(
        <EditItemDialog open={false} onClose={vi.fn()} onItemRenamed={vi.fn()} />
      );
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
      render(<EditItemDialog open={true} onClose={vi.fn()} onItemRenamed={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('displays correct title', () => {
      render(<EditItemDialog open={true} onClose={vi.fn()} onItemRenamed={vi.fn()} />);

      const title = screen.getByText(/Edit Item/i);
      expect(title).toBeInTheDocument();
    });

    it('renders form component', () => {
      render(<EditItemDialog open={true} onClose={vi.fn()} onItemRenamed={vi.fn()} />);

      expect(screen.getByTestId('form')).toBeInTheDocument();
    });
  });

  describe('Dialog actions', () => {
    it('renders close button', () => {
      render(<EditItemDialog open={true} onClose={vi.fn()} onItemRenamed={vi.fn()} />);

      const closeButton = screen.queryByRole('button', { name: /close|cancel/i });
      expect(closeButton || screen.queryByTestId('close-button')).toBeTruthy();
    });

    it('has accessible dialog structure', () => {
      render(<EditItemDialog open={true} onClose={vi.fn()} onItemRenamed={vi.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName();
    });
  });
});
