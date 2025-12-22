/**
 * @file InventoryToolbar.test.tsx
 * @module pages/inventory/components/InventoryToolbar.test
 * 
 * Unit tests for InventoryToolbar component.
 * Tests button rendering and click event handlers.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/__tests__/test/test-utils';
import userEvent from '@testing-library/user-event';
import { InventoryToolbar } from '@/pages/inventory/components/InventoryToolbar';

describe('InventoryToolbar', () => {
  const mockHandlers = {
    onAddNew: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAdjustQty: vi.fn(),
    onChangePrice: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all action buttons', () => {
    render(<InventoryToolbar {...mockHandlers} />);

    expect(screen.getByRole('button', { name: /add new item/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /adjust quantity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change price/i })).toBeInTheDocument();
  });

  it('should call onAddNew when Add new item button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const addButton = screen.getByRole('button', { name: /add new item/i });
    await user.click(addButton);

    expect(mockHandlers.onAddNew).toHaveBeenCalledTimes(1);
  });

  it('should call onEdit when Edit button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when Delete button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onAdjustQty when Adjust quantity button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const adjustButton = screen.getByRole('button', { name: /adjust quantity/i });
    await user.click(adjustButton);

    expect(mockHandlers.onAdjustQty).toHaveBeenCalledTimes(1);
  });

  it('should call onChangePrice when Change price button clicked', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const priceButton = screen.getByRole('button', { name: /change price/i });
    await user.click(priceButton);

    expect(mockHandlers.onChangePrice).toHaveBeenCalledTimes(1);
  });

  it('should have Add new item button with contained variant', () => {
    render(<InventoryToolbar {...mockHandlers} />);

    const addButton = screen.getByRole('button', { name: /add new item/i });
    expect(addButton).toHaveClass('MuiButton-contained');
  });

  it('should not call handlers on initial render', () => {
    render(<InventoryToolbar {...mockHandlers} />);

    expect(mockHandlers.onAddNew).not.toHaveBeenCalled();
    expect(mockHandlers.onEdit).not.toHaveBeenCalled();
    expect(mockHandlers.onDelete).not.toHaveBeenCalled();
    expect(mockHandlers.onAdjustQty).not.toHaveBeenCalled();
    expect(mockHandlers.onChangePrice).not.toHaveBeenCalled();
  });

  it('should handle multiple clicks on same button', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    const addButton = screen.getByRole('button', { name: /add new item/i });
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    expect(mockHandlers.onAddNew).toHaveBeenCalledTimes(3);
  });

  it('should handle clicks on different buttons independently', async () => {
    const user = userEvent.setup();
    render(<InventoryToolbar {...mockHandlers} />);

    await user.click(screen.getByRole('button', { name: /add new item/i }));
    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockHandlers.onAddNew).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onEdit).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    expect(mockHandlers.onAdjustQty).not.toHaveBeenCalled();
    expect(mockHandlers.onChangePrice).not.toHaveBeenCalled();
  });
});
