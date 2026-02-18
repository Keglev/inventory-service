/**
 * @file InventoryDialogsWiring.test.tsx
 * @module __tests__/components/pages/inventory/InventoryDialogsWiring
 * @description Contract tests for InventoryDialogs composition:
 * - Renders the expected dialog when its open-flag is set.
 * - Keeps tests stable by mocking dialog implementations and asserting via testids.
 *
 * Out of scope:
 * - Individual dialog behavior (covered in each dialog's own test suite).
 * - MUI/portal rendering details.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { InventoryRow } from '../../../../api/inventory/types';

// Mock dialog implementations: keep this suite focused on wiring/flags.
vi.mock('../../../../pages/inventory/dialogs/ItemFormDialog', () => ({
  ItemFormDialog: vi.fn(({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="item-form-dialog">ItemFormDialog</div> : null
  ),
}));

vi.mock('../../../../pages/inventory/dialogs/EditItemDialog', () => ({
  EditItemDialog: vi.fn(({ open }: { open: boolean }) => 
    open ? <div data-testid="edit-item-dialog">EditItemDialog</div> : null
  ),
}));

vi.mock('../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog', () => ({
  default: vi.fn(({ open }: { open: boolean }) => 
    open ? <div data-testid="delete-item-dialog">DeleteItemDialog</div> : null
  ),
}));

vi.mock('../../../../pages/inventory/dialogs/QuantityAdjustDialog', () => ({
  QuantityAdjustDialog: vi.fn(({ open }: { open: boolean }) => 
    open ? <div data-testid="quantity-adjust-dialog">QuantityAdjustDialog</div> : null
  ),
}));

vi.mock('../../../../pages/inventory/dialogs/PriceChangeDialog', () => ({
  PriceChangeDialog: vi.fn(({ open }: { open: boolean }) => 
    open ? <div data-testid="price-change-dialog">PriceChangeDialog</div> : null
  ),
}));

// Import after mocks (ESM): the component should observe the mocked modules.
import { InventoryDialogs } from '../../../../pages/inventory/components/InventoryDialogs';

type Props = ComponentProps<typeof InventoryDialogs>;

describe('InventoryDialogs', () => {
  const mockSelectedRow: InventoryRow = {
    id: 'item-123',
    name: 'Test Item',
    code: 'TEST-001',
    supplierId: '999',
    onHand: 50,
    minQty: 10,
    updatedAt: '2024-01-01',
  };

  const baseProps: Props = {
    openNew: false,
    setOpenNew: vi.fn(),
    openEditName: false,
    setOpenEditName: vi.fn(),
    openDelete: false,
    setOpenDelete: vi.fn(),
    openEdit: false,
    setOpenEdit: vi.fn(),
    openAdjust: false,
    setOpenAdjust: vi.fn(),
    openPrice: false,
    setOpenPrice: vi.fn(),
    selectedRow: null,
    onReload: vi.fn(),
    isDemo: false,
  };

  const renderDialogs = (props: Partial<typeof baseProps> = {}) =>
    render(<InventoryDialogs {...baseProps} {...props} />);

  it('renders no dialogs when all are closed', () => {
    const { queryByTestId } = renderDialogs();
    expect(queryByTestId('item-form-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('edit-item-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('delete-item-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('quantity-adjust-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('price-change-dialog')).not.toBeInTheDocument();
  });

  it.each([
    ['openNew', 'item-form-dialog'],
    ['openEditName', 'edit-item-dialog'],
    ['openDelete', 'delete-item-dialog'],
    ['openAdjust', 'quantity-adjust-dialog'],
    ['openPrice', 'price-change-dialog'],
  ] as const)('renders %s dialog', (openProp, testId) => {
    const { getByTestId } = renderDialogs({ [openProp]: true } as Partial<typeof baseProps>);
    expect(getByTestId(testId)).toBeInTheDocument();
  });

  it('renders edit ItemFormDialog only when selectedRow is present', () => {
    const closed = renderDialogs({ openEdit: true, selectedRow: null });
    expect(closed.queryByTestId('item-form-dialog')).not.toBeInTheDocument();

    const open = renderDialogs({ openEdit: true, selectedRow: mockSelectedRow });
    expect(open.getByTestId('item-form-dialog')).toBeInTheDocument();
  });

  it('can render multiple dialogs simultaneously', () => {
    const { getByTestId } = renderDialogs({ openNew: true, openDelete: true, openAdjust: true });

    expect(getByTestId('item-form-dialog')).toBeInTheDocument();
    expect(getByTestId('delete-item-dialog')).toBeInTheDocument();
    expect(getByTestId('quantity-adjust-dialog')).toBeInTheDocument();
  });
});
