import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SuppliersDialogs } from '../../../../pages/suppliers/components/SuppliersDialogs';

// Mock all dialog components
vi.mock('../../../../pages/suppliers/dialogs/CreateSupplierDialog', () => ({
  CreateSupplierDialog: vi.fn(({ open }) => 
    open ? <div data-testid="create-supplier-dialog">Create Dialog</div> : null
  ),
}));

vi.mock('../../../../pages/suppliers/dialogs/EditSupplierDialog', () => ({
  EditSupplierDialog: vi.fn(({ open }) => 
    open ? <div data-testid="edit-supplier-dialog">Edit Dialog</div> : null
  ),
}));

vi.mock('../../../../pages/suppliers/dialogs/DeleteSupplierDialog', () => ({
  DeleteSupplierDialog: vi.fn(({ open }) => 
    open ? <div data-testid="delete-supplier-dialog">Delete Dialog</div> : null
  ),
}));

describe('SuppliersDialogs', () => {
  const defaultProps = {
    openCreate: false,
    onCloseCreate: vi.fn(),
    onCreated: vi.fn(),
    openEdit: false,
    onCloseEdit: vi.fn(),
    onUpdated: vi.fn(),
    openDelete: false,
    onCloseDelete: vi.fn(),
    onDeleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render any dialog when all are closed', () => {
    render(<SuppliersDialogs {...defaultProps} />);
    expect(screen.queryByTestId('create-supplier-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-supplier-dialog')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-supplier-dialog')).not.toBeInTheDocument();
  });

  it('renders create dialog when openCreate is true', () => {
    render(<SuppliersDialogs {...defaultProps} openCreate={true} />);
    expect(screen.getByTestId('create-supplier-dialog')).toBeInTheDocument();
  });

  it('does not render create dialog when openCreate is false', () => {
    render(<SuppliersDialogs {...defaultProps} openCreate={false} />);
    expect(screen.queryByTestId('create-supplier-dialog')).not.toBeInTheDocument();
  });

  it('renders edit dialog when openEdit is true', () => {
    render(<SuppliersDialogs {...defaultProps} openEdit={true} />);
    expect(screen.getByTestId('edit-supplier-dialog')).toBeInTheDocument();
  });

  it('does not render edit dialog when openEdit is false', () => {
    render(<SuppliersDialogs {...defaultProps} openEdit={false} />);
    expect(screen.queryByTestId('edit-supplier-dialog')).not.toBeInTheDocument();
  });

  it('renders delete dialog when openDelete is true', () => {
    render(<SuppliersDialogs {...defaultProps} openDelete={true} />);
    expect(screen.getByTestId('delete-supplier-dialog')).toBeInTheDocument();
  });

  it('does not render delete dialog when openDelete is false', () => {
    render(<SuppliersDialogs {...defaultProps} openDelete={false} />);
    expect(screen.queryByTestId('delete-supplier-dialog')).not.toBeInTheDocument();
  });

  it('can render multiple dialogs simultaneously', () => {
    render(
      <SuppliersDialogs
        {...defaultProps}
        openCreate={true}
        openEdit={true}
        openDelete={true}
      />
    );
    expect(screen.getByTestId('create-supplier-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('edit-supplier-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('delete-supplier-dialog')).toBeInTheDocument();
  });
});
