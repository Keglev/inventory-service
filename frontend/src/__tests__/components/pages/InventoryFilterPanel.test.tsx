/**
 * @file InventoryFilterPanel.test.tsx
 * @module pages/inventory/components/InventoryFilterPanel.test
 * 
 * Unit tests for InventoryFilterPanel component.
 * Tests filter controls, search field, supplier dropdown, and checkbox interactions.
 * Max 250 lines including comments.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@/__tests__/test/test-utils';
import userEvent from '@testing-library/user-event';
import { InventoryFilterPanel } from '@/pages/inventory/components/InventoryFilterPanel';
import type { SupplierOption } from '@/api/analytics/types';

describe('InventoryFilterPanel', () => {
  const mockSuppliers: SupplierOption[] = [
    { id: '1', label: 'Supplier A' },
    { id: '2', label: 'Supplier B' },
    { id: '3', label: 'Supplier C' },
  ];

  const defaultProps = {
    q: '',
    setQ: vi.fn(),
    supplierId: null,
    setSupplierId: vi.fn(),
    belowMinOnly: false,
    setBelowMinOnly: vi.fn(),
    suppliers: mockSuppliers,
    supplierLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search field with current value', () => {
    render(<InventoryFilterPanel {...defaultProps} q="test search" />);

    const searchField = screen.getByRole('textbox', { name: /search/i });
    expect(searchField).toHaveValue('test search');
  });

  it('should call setQ when search field changes', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} />);

    const searchField = screen.getByRole('textbox', { name: /search/i });
    await user.type(searchField, 'widget');

    expect(defaultProps.setQ).toHaveBeenCalled();
  });

  it('should render supplier dropdown with all suppliers', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} />);

    const supplierSelect = screen.getByRole('combobox');
    await user.click(supplierSelect);

    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getByRole('option', { name: /all suppliers/i })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier A' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier B' })).toBeInTheDocument();
    expect(within(listbox).getByRole('option', { name: 'Supplier C' })).toBeInTheDocument();
  });

  it('should call setSupplierId when supplier selected', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} />);

    const supplierSelect = screen.getByRole('combobox');
    await user.click(supplierSelect);

    const option = screen.getByRole('option', { name: 'Supplier A' });
    await user.click(option);

    expect(defaultProps.setSupplierId).toHaveBeenCalledWith('1');
  });

  it('should call setSupplierId with null when "All suppliers" selected', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} supplierId="1" />);

    const supplierSelect = screen.getByRole('combobox');
    await user.click(supplierSelect);

    const allOption = screen.getByRole('option', { name: /all suppliers/i });
    await user.click(allOption);

    expect(defaultProps.setSupplierId).toHaveBeenCalledWith(null);
  });

  it('should render below minimum checkbox unchecked by default', () => {
    render(<InventoryFilterPanel {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /below minimum quantity only/i });
    expect(checkbox).not.toBeChecked();
  });

  it('should render below minimum checkbox checked when prop is true', () => {
    render(<InventoryFilterPanel {...defaultProps} belowMinOnly={true} />);

    const checkbox = screen.getByRole('checkbox', { name: /below minimum quantity only/i });
    expect(checkbox).toBeChecked();
  });

  it('should call setBelowMinOnly when checkbox toggled', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} />);

    const checkbox = screen.getByRole('checkbox', { name: /below minimum quantity only/i });
    await user.click(checkbox);

    expect(defaultProps.setBelowMinOnly).toHaveBeenCalledWith(true);
  });

  it('should disable supplier dropdown when loading', () => {
    render(<InventoryFilterPanel {...defaultProps} supplierLoading={true} />);

    const supplierSelect = screen.getByRole('combobox');
    expect(supplierSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('should handle empty suppliers array', () => {
    render(<InventoryFilterPanel {...defaultProps} suppliers={[]} />);

    // Should still render the dropdown
    expect(screen.getAllByText('Supplier')[0]).toBeInTheDocument();
  });

  it('should handle undefined suppliers', () => {
    render(<InventoryFilterPanel {...defaultProps} suppliers={undefined} />);

    // Should still render the dropdown
    expect(screen.getAllByText('Supplier')[0]).toBeInTheDocument();
  });

  it('should show selected supplier in dropdown', () => {
    render(<InventoryFilterPanel {...defaultProps} supplierId="2" />);

    // MUI Select displays the selected text
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('should handle numeric supplierId', () => {
    render(<InventoryFilterPanel {...defaultProps} supplierId={123} />);

    expect(screen.getAllByText('Supplier')[0]).toBeInTheDocument();
  });

  it('should render all filter controls simultaneously', () => {
    render(<InventoryFilterPanel {...defaultProps} />);

    expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
    expect(screen.getAllByText('Supplier')[0]).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /below minimum/i })).toBeInTheDocument();
  });

  it('should clear search when empty string typed', async () => {
    const user = userEvent.setup();
    render(<InventoryFilterPanel {...defaultProps} q="initial" />);

    const searchField = screen.getByRole('textbox', { name: /search/i });
    await user.clear(searchField);

    expect(defaultProps.setQ).toHaveBeenCalledWith('');
  });
});
