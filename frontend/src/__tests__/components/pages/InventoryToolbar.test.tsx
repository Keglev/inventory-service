/**
 * @file InventoryToolbar.test.tsx
 * @module __tests__/components/pages/InventoryToolbar
 * @description
 * Enterprise unit tests for InventoryToolbar.
 *
 * Contract:
 * - Renders all action buttons.
 * - Clicking a button triggers exactly its corresponding handler.
 * - The primary action ("Add new item") uses contained styling.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

import { render } from '@/__tests__/test/test-utils';
import { InventoryToolbar } from '@/pages/inventory/components/InventoryToolbar';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockOnAddNew = vi.hoisted(() => vi.fn());
const mockOnEdit = vi.hoisted(() => vi.fn());
const mockOnDelete = vi.hoisted(() => vi.fn());
const mockOnAdjustQty = vi.hoisted(() => vi.fn());
const mockOnChangePrice = vi.hoisted(() => vi.fn());

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Props = React.ComponentProps<typeof InventoryToolbar>;

function setup() {
  const props: Props = {
    onAddNew: mockOnAddNew,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onAdjustQty: mockOnAdjustQty,
    onChangePrice: mockOnChangePrice,
  };

  render(<InventoryToolbar {...props} />);
  return { props };
}

const buttons = {
  add: /add new item/i,
  edit: /edit/i,
  delete: /delete/i,
  adjust: /adjust quantity/i,
  price: /change price/i,
} as const;

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('InventoryToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all action buttons', () => {
    setup();

    expect(screen.getByRole('button', { name: buttons.add })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.delete })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.adjust })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.price })).toBeInTheDocument();
  });

  it('does not trigger any handlers on initial render', () => {
    setup();

    // Regression guard: ensures no side effects fire on mount.
    expect(mockOnAddNew).not.toHaveBeenCalled();
    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(mockOnAdjustQty).not.toHaveBeenCalled();
    expect(mockOnChangePrice).not.toHaveBeenCalled();
  });

  it('calls the correct handler when each button is clicked', async () => {
    const user = userEvent.setup();
    setup();

    const cases: Array<{
      buttonName: RegExp;
      handler: ReturnType<typeof vi.fn>;
      handlerLabel: string;
    }> = [
      { buttonName: buttons.add, handler: mockOnAddNew, handlerLabel: 'onAddNew' },
      { buttonName: buttons.edit, handler: mockOnEdit, handlerLabel: 'onEdit' },
      { buttonName: buttons.delete, handler: mockOnDelete, handlerLabel: 'onDelete' },
      { buttonName: buttons.adjust, handler: mockOnAdjustQty, handlerLabel: 'onAdjustQty' },
      { buttonName: buttons.price, handler: mockOnChangePrice, handlerLabel: 'onChangePrice' },
    ];

    for (const c of cases) {
      await user.click(screen.getByRole('button', { name: c.buttonName }));
      expect(c.handler, c.handlerLabel).toHaveBeenCalledTimes(1);

      // Reset between iterations so each case asserts the single-click contract cleanly.
      vi.clearAllMocks();
    }
  });

  it('uses contained styling for the primary action button', () => {
    setup();

    // Styling contract: primary action is visually emphasized in the toolbar.
    expect(screen.getByRole('button', { name: buttons.add })).toHaveClass('MuiButton-contained');
  });

  it('supports multiple clicks on the same action', async () => {
    const user = userEvent.setup();
    setup();

    const addButton = screen.getByRole('button', { name: buttons.add });
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    expect(mockOnAddNew).toHaveBeenCalledTimes(3);
  });

  it('handles clicks on different buttons independently', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole('button', { name: buttons.add }));
    await user.click(screen.getByRole('button', { name: buttons.edit }));
    await user.click(screen.getByRole('button', { name: buttons.delete }));

    expect(mockOnAddNew).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnAdjustQty).not.toHaveBeenCalled();
    expect(mockOnChangePrice).not.toHaveBeenCalled();
  });
});
