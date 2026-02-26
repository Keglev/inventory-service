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
import { ItemFormDialog } from '../../../../pages/inventory/dialogs/ItemFormDialog';
import { EditItemDialog } from '../../../../pages/inventory/dialogs/EditItemDialog';
import DeleteItemDialog from '../../../../pages/inventory/dialogs/DeleteItemDialog/DeleteItemDialog';
import { QuantityAdjustDialog } from '../../../../pages/inventory/dialogs/QuantityAdjustDialog';
import { PriceChangeDialog } from '../../../../pages/inventory/dialogs/PriceChangeDialog';

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

  it('wires each dialog onClose to the corresponding setter', () => {
    renderDialogs({
      openNew: true,
      openEditName: true,
      openDelete: true,
      openAdjust: true,
      openPrice: true,
    });

    const itemFormDialogMock = vi.mocked(ItemFormDialog);
    const editItemDialogMock = vi.mocked(EditItemDialog);
    const deleteItemDialogMock = vi.mocked(DeleteItemDialog);
    const quantityAdjustDialogMock = vi.mocked(QuantityAdjustDialog);
    const priceChangeDialogMock = vi.mocked(PriceChangeDialog);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (itemFormDialogMock.mock.calls[0]?.[0] as any).onClose();
    expect(baseProps.setOpenNew).toHaveBeenCalledWith(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editItemDialogMock.mock.calls[0]?.[0] as any).onClose();
    expect(baseProps.setOpenEditName).toHaveBeenCalledWith(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (deleteItemDialogMock.mock.calls[0]?.[0] as any).onClose();
    expect(baseProps.setOpenDelete).toHaveBeenCalledWith(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (quantityAdjustDialogMock.mock.calls[0]?.[0] as any).onClose();
    expect(baseProps.setOpenAdjust).toHaveBeenCalledWith(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (priceChangeDialogMock.mock.calls[0]?.[0] as any).onClose();
    expect(baseProps.setOpenPrice).toHaveBeenCalledWith(false);
  });

  it('wires the edit ItemFormDialog onClose to setOpenEdit(false) when selectedRow is present', () => {
    renderDialogs({ openEdit: true, selectedRow: mockSelectedRow });

    const itemFormDialogMock = vi.mocked(ItemFormDialog);
    const editCall = itemFormDialogMock.mock.calls.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (call) => Boolean((call?.[0] as any)?.initial),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editCall?.[0] as any).onClose();
    expect(baseProps.setOpenEdit).toHaveBeenCalledWith(false);
  });

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
