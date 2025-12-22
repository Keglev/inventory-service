import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersToolbar } from '../../../../pages/suppliers/components/SuppliersToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SuppliersToolbar', () => {
  const defaultProps = {
    onCreateClick: vi.fn(),
    editEnabled: false,
    onEditClick: vi.fn(),
    deleteEnabled: false,
    onDeleteClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders title', () => {
    render(<SuppliersToolbar {...defaultProps} />);
    expect(screen.getByText('suppliers:title')).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(<SuppliersToolbar {...defaultProps} />);
    expect(screen.getByText('suppliers:actions.create')).toBeInTheDocument();
    expect(screen.getByText('suppliers:actions.edit')).toBeInTheDocument();
    expect(screen.getByText('suppliers:actions.delete')).toBeInTheDocument();
  });

  it('create button is always enabled', () => {
    render(<SuppliersToolbar {...defaultProps} />);
    const createButton = screen.getByText('suppliers:actions.create');
    expect(createButton).not.toBeDisabled();
  });

  it('edit button is disabled when editEnabled is false', () => {
    render(<SuppliersToolbar {...defaultProps} editEnabled={false} />);
    const editButton = screen.getByText('suppliers:actions.edit');
    expect(editButton).toBeDisabled();
  });

  it('edit button is enabled when editEnabled is true', () => {
    render(<SuppliersToolbar {...defaultProps} editEnabled={true} />);
    const editButton = screen.getByText('suppliers:actions.edit');
    expect(editButton).not.toBeDisabled();
  });

  it('delete button is disabled when deleteEnabled is false', () => {
    render(<SuppliersToolbar {...defaultProps} deleteEnabled={false} />);
    const deleteButton = screen.getByText('suppliers:actions.delete');
    expect(deleteButton).toBeDisabled();
  });

  it('delete button is enabled when deleteEnabled is true', () => {
    render(<SuppliersToolbar {...defaultProps} deleteEnabled={true} />);
    const deleteButton = screen.getByText('suppliers:actions.delete');
    expect(deleteButton).not.toBeDisabled();
  });

  it('calls onCreateClick when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<SuppliersToolbar {...defaultProps} />);
    const createButton = screen.getByText('suppliers:actions.create');
    await user.click(createButton);
    expect(defaultProps.onCreateClick).toHaveBeenCalledTimes(1);
  });

  it('calls onEditClick when edit button is clicked and enabled', async () => {
    const user = userEvent.setup();
    render(<SuppliersToolbar {...defaultProps} editEnabled={true} />);
    const editButton = screen.getByText('suppliers:actions.edit');
    await user.click(editButton);
    expect(defaultProps.onEditClick).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteClick when delete button is clicked and enabled', async () => {
    const user = userEvent.setup();
    render(<SuppliersToolbar {...defaultProps} deleteEnabled={true} />);
    const deleteButton = screen.getByText('suppliers:actions.delete');
    await user.click(deleteButton);
    expect(defaultProps.onDeleteClick).toHaveBeenCalledTimes(1);
  });
});
