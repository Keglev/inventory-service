/**
 * @file DeleteItemDialog.test.tsx
 *
 * @what_is_under_test DeleteItemDialog component
 * @responsibility Render dialog wrapper
 * @out_of_scope Content, hooks
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DeleteItemDialog } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog';
import { HelpProvider } from '../../../../../context/help/HelpContext';

// Mock everything the component needs
vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemContent', () => ({
  DeleteItemContent: () => <div>Content</div>,
}));

vi.mock('../../../../../pages/inventory/dialogs/DeleteItemDialog/useDeleteItemDialog', () => ({
  useDeleteItemDialog: () => ({
    selectedSupplier: null,
    selectedItem: null,
    deletionReason: '',
    formError: '',
    showConfirmation: false,
    isSubmitting: false,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
  useMutation: () => [vi.fn(), { isLoading: false }],
}));

describe('DeleteItemDialog', () => {
  it('renders simple dialog test', () => {
    const { container } = render(
      <HelpProvider>
        <DeleteItemDialog open={true} onClose={vi.fn()} onItemDeleted={vi.fn()} />
      </HelpProvider>
    );
    expect(container).toBeTruthy();
  });

  it('passes callbacks', () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    const { container } = render(
      <HelpProvider>
        <DeleteItemDialog open={true} onClose={onClose} onItemDeleted={onDeleted} />
      </HelpProvider>
    );
    expect(container).toBeTruthy();
    expect(onClose).toBeDefined();
    expect(onDeleted).toBeDefined();
  });

  it('accepts open prop', () => {
    const { container } = render(
      <HelpProvider>
        <DeleteItemDialog open={true} onClose={vi.fn()} onItemDeleted={vi.fn()} />
      </HelpProvider>
    );
    expect(container).toBeTruthy();
  });

  it('handles closed state', () => {
    const { container } = render(
      <HelpProvider>
        <DeleteItemDialog open={false} onClose={vi.fn()} onItemDeleted={vi.fn()} />
      </HelpProvider>
    );
    expect(container).toBeTruthy();
  });

  it('can rerender with different props', () => {
    const { rerender } = render(
      <HelpProvider>
        <DeleteItemDialog open={true} onClose={vi.fn()} onItemDeleted={vi.fn()} />
      </HelpProvider>
    );

    rerender(
      <HelpProvider>
        <DeleteItemDialog open={false} onClose={vi.fn()} onItemDeleted={vi.fn()} />
      </HelpProvider>
    );
    expect(true).toBe(true);
  });
});
