/**
 * @file InventoryToolbar.test.tsx
 * @module __tests__/components/pages/InventoryToolbar
 * @description Contract tests for the `InventoryToolbar` presentation component.
 *
 * Contract under test:
 * - Renders the five action buttons.
 * - Delegates user intent via callbacks: `onAddNew`, `onEdit`, `onDelete`, `onAdjustQty`, `onChangePrice`.
 * - Clicking one action triggers exactly its corresponding handler.
 *
 * Out of scope:
 * - MUI styling and class names (variant implementation details).
 * - Any orchestration/business rules (owned by the inventory board/orchestrator).
 *
 * Test strategy:
 * - Mock i18n to always use fallback strings so button labels are stable.
 * - Assert accessible button roles/names and handler delegation only.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { render } from '@/__tests__/test/test-utils';
import { InventoryToolbar } from '@/pages/inventory/components/InventoryToolbar';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockOnAddNew = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();
const mockOnAdjustQty = vi.fn();
const mockOnChangePrice = vi.fn();

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type Props = ComponentProps<typeof InventoryToolbar>;

// Props builder: keeps test setup consistent and minimizes duplication.
const createProps = (): Props => ({
  onAddNew: mockOnAddNew,
  onEdit: mockOnEdit,
  onDelete: mockOnDelete,
  onAdjustQty: mockOnAdjustQty,
  onChangePrice: mockOnChangePrice,
});

const renderToolbar = () => {
  const props = createProps();
  render(<InventoryToolbar {...props} />);
  return { props };
};

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
    renderToolbar();

    expect(screen.getByRole('button', { name: buttons.add })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.edit })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.delete })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.adjust })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: buttons.price })).toBeInTheDocument();
  });

  it('does not trigger any handlers on initial render', () => {
    renderToolbar();

    // Regression guard: presentation components should not fire side effects on mount.
    expect(mockOnAddNew).not.toHaveBeenCalled();
    expect(mockOnEdit).not.toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
    expect(mockOnAdjustQty).not.toHaveBeenCalled();
    expect(mockOnChangePrice).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'Add new item', buttonName: buttons.add, expectedHandler: mockOnAddNew },
    { name: 'Edit', buttonName: buttons.edit, expectedHandler: mockOnEdit },
    { name: 'Delete', buttonName: buttons.delete, expectedHandler: mockOnDelete },
    { name: 'Adjust quantity', buttonName: buttons.adjust, expectedHandler: mockOnAdjustQty },
    { name: 'Change price', buttonName: buttons.price, expectedHandler: mockOnChangePrice },
  ])('delegates click intent ($name)', async ({ buttonName, expectedHandler }) => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole('button', { name: buttonName }));
    expect(expectedHandler).toHaveBeenCalledTimes(1);

    // Clicking one action must not trigger any other handler.
    const allHandlers = [
      mockOnAddNew,
      mockOnEdit,
      mockOnDelete,
      mockOnAdjustQty,
      mockOnChangePrice,
    ];
    for (const h of allHandlers) {
      if (h !== expectedHandler) {
        expect(h).not.toHaveBeenCalled();
      }
    }
  });

  it('supports multiple clicks on the same action', async () => {
    const user = userEvent.setup();
    renderToolbar();

    const addButton = screen.getByRole('button', { name: buttons.add });
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    expect(mockOnAddNew).toHaveBeenCalledTimes(3);
  });
});
