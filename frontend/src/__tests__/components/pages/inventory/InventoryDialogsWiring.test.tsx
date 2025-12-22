/**
 * @file InventoryDialogs.test.tsx
 * @module __tests__/pages/inventory/InventoryDialogs
 * 
 * @summary
 * Tests for InventoryDialogs component.
 * Tests rendering and prop passing of all 5 inventory dialog components.
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { InventoryRow } from '../../../../api/inventory/types';

// Mock all dialog components to avoid file handle issues
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

// Import after mocks
import { InventoryDialogs } from '../../../../pages/inventory/components/InventoryDialogs';

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

  const defaultProps = {
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

  it('should render without crashing when all dialogs are closed', () => {
    const { container } = render(<InventoryDialogs {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render ItemFormDialog when openNew is true', () => {
    const { getByTestId } = render(
      <InventoryDialogs {...defaultProps} openNew={true} />
    );
    
    expect(getByTestId('item-form-dialog')).toBeInTheDocument();
  });

  it('should render EditItemDialog when openEditName is true', () => {
    const { getByTestId } = render(
      <InventoryDialogs {...defaultProps} openEditName={true} />
    );
    
    expect(getByTestId('edit-item-dialog')).toBeInTheDocument();
  });

  it('should render DeleteItemDialog when openDelete is true', () => {
    const { getByTestId } = render(
      <InventoryDialogs {...defaultProps} openDelete={true} />
    );
    
    expect(getByTestId('delete-item-dialog')).toBeInTheDocument();
  });

  it('should render ItemFormDialog for edit when openEdit is true and selectedRow exists', () => {
    const { getByTestId } = render(
      <InventoryDialogs
        {...defaultProps}
        openEdit={true}
        selectedRow={mockSelectedRow}
      />
    );
    
    expect(getByTestId('item-form-dialog')).toBeInTheDocument();
  });

  it('should not render edit ItemFormDialog when selectedRow is null', () => {
    const { queryByTestId } = render(
      <InventoryDialogs {...defaultProps} openEdit={true} selectedRow={null} />
    );
    
    expect(queryByTestId('item-form-dialog')).not.toBeInTheDocument();
  });

  it('should render QuantityAdjustDialog when openAdjust is true', () => {
    const { getByTestId } = render(
      <InventoryDialogs {...defaultProps} openAdjust={true} />
    );
    
    expect(getByTestId('quantity-adjust-dialog')).toBeInTheDocument();
  });

  it('should render PriceChangeDialog when openPrice is true', () => {
    const { getByTestId } = render(
      <InventoryDialogs {...defaultProps} openPrice={true} />
    );
    
    expect(getByTestId('price-change-dialog')).toBeInTheDocument();
  });

  it('should render multiple dialogs simultaneously', () => {
    const { getByTestId } = render(
      <InventoryDialogs
        {...defaultProps}
        openNew={true}
        openDelete={true}
        openAdjust={true}
      />
    );
    
    expect(getByTestId('item-form-dialog')).toBeInTheDocument();
    expect(getByTestId('delete-item-dialog')).toBeInTheDocument();
    expect(getByTestId('quantity-adjust-dialog')).toBeInTheDocument();
  });

  it('should not render any dialogs when all are closed', () => {
    const { queryByTestId } = render(<InventoryDialogs {...defaultProps} />);
    
    expect(queryByTestId('item-form-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('edit-item-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('delete-item-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('quantity-adjust-dialog')).not.toBeInTheDocument();
    expect(queryByTestId('price-change-dialog')).not.toBeInTheDocument();
  });

  it('should handle isDemo prop correctly', () => {
    const { container } = render(
      <InventoryDialogs {...defaultProps} isDemo={true} />
    );
    
    expect(container).toBeInTheDocument();
  });

  it('should handle selectedRow with minimal data', () => {
    const minimalRow: InventoryRow = {
      id: 'item-456',
      name: 'Minimal Item',
      supplierId: '111',
      onHand: 0,
      minQty: 0,
      updatedAt: '2024-01-01',
    };

    const { container } = render(
      <InventoryDialogs
        {...defaultProps}
        selectedRow={minimalRow}
        openEdit={true}
      />
    );
    
    expect(container).toBeInTheDocument();
  });
});
