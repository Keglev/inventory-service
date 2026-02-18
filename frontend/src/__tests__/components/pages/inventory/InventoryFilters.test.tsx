/**
 * @file InventoryFilters.test.tsx
 * @module __tests__/components/pages/inventory/InventoryFilters
 * @description Contract tests for InventoryFilters:
 * - Emits `onQChange` and `onSupplierChange` callbacks.
 * - Disables supplier select while loading.
 *
 * Out of scope:
 * - MUI menu implementation details.
 * - i18n translation correctness (keys are stabilized via testSetup).
 */

import './testSetup';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { InventoryFilters } from '@/pages/inventory/InventoryFilters';
import type { SupplierOption } from '@/pages/inventory/InventoryFilters';

describe('InventoryFilters', () => {
  // Contract spies for callback wiring.
  const mockOnQChange = vi.fn();
  const mockOnSupplierChange = vi.fn();

  // Stable test fixtures.
  const suppliers: SupplierOption[] = [
    { id: '1', label: 'Supplier A' },
    { id: '2', label: 'Supplier B' },
    { id: '3', label: 'Supplier C' },
  ];

  // Render helper: keeps tests focused on assertions.
  const renderFilters = (props: Partial<ComponentProps<typeof InventoryFilters>> = {}) => {
    const defaultProps: ComponentProps<typeof InventoryFilters> = {
      q: '',
      onQChange: mockOnQChange,
      supplierId: '',
      onSupplierChange: mockOnSupplierChange,
      supplierOptions: suppliers,
      supplierLoading: false,
      ...props,
    };
    return render(<InventoryFilters {...defaultProps} />);
  };

  beforeEach(() => {
    // Ensure isolation between tests.
    vi.clearAllMocks();
  });

  it('renders the supplier select and search input', () => {
    renderFilters();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByLabelText('Search items...')).toBeInTheDocument();
  });

  it('displays all supplier options in dropdown', () => {
    renderFilters();
    const supplierSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);
    
    // Check that all suppliers appear as menu items
    suppliers.forEach((supplier) => {
      expect(screen.getByText(supplier.label)).toBeInTheDocument();
    });
  });

  it('shows all suppliers option as empty menu item', () => {
    // Verify that empty option for "All Suppliers" is available
    renderFilters();
    const supplierSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);
    
    // Empty value option should be present
    const allSuppliersOption = screen.getByText('All Suppliers');
    expect(allSuppliersOption).toBeInTheDocument();
  });

  it('calls onSupplierChange when supplier is selected', () => {
    renderFilters();
    const supplierSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);
    
    const supplierOption = screen.getByText('Supplier A');
    fireEvent.click(supplierOption);
    
    expect(mockOnSupplierChange).toHaveBeenCalled();
  });

  it('calls onQChange when search text is entered', () => {
    renderFilters();
    const searchInput = screen.getByLabelText('Search items...');

    fireEvent.change(searchInput, { target: { value: 'test item' } });
    
    expect(mockOnQChange).toHaveBeenCalledWith('test item');
  });

  it('displays current search query value', () => {
    // Verify that the search input shows current query value
    renderFilters({ q: 'current search' });
    const searchInput = screen.getByDisplayValue('current search');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays selected supplier value', () => {
    renderFilters({ supplierId: '1' });
    const supplierSelect = screen.getByRole('combobox');
    expect(supplierSelect).toHaveTextContent('Supplier A');
  });

  it('shows loading spinner when suppliers are loading', () => {
    renderFilters({ supplierLoading: true });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables supplier select when loading', () => {
    renderFilters({ supplierLoading: true });
    const supplierSelect = screen.getByRole('combobox');
    // MUI Select uses aria-disabled instead of the disabled attribute on the div wrapper
    expect(supplierSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables search input when disableSearchUntilSupplier is true and no supplier selected', () => {
    renderFilters({
      disableSearchUntilSupplier: true,
      supplierId: '',
    });
    const searchInput = screen.getByLabelText('Search items...') as HTMLInputElement;
    expect(searchInput).toBeDisabled();
  });

  it('enables search input when supplier is selected', () => {
    renderFilters({
      disableSearchUntilSupplier: true,
      supplierId: '1',
    });
    const searchInput = screen.getByLabelText('Search items...') as HTMLInputElement;
    expect(searchInput).not.toBeDisabled();
  });
});
