/**
 * @file InventoryFilters.test.tsx
 * @description
 * Test suite for InventoryFilters component.
 * Verifies supplier selection, search functionality, loading states, and conditional disabling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InventoryFilters } from '@/pages/inventory/InventoryFilters';
import type { SupplierOption } from '@/pages/inventory/InventoryFilters';

// Mock react-i18next for translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('InventoryFilters', () => {
  // Mock callback functions
  const mockOnQChange = vi.fn();
  const mockOnSupplierChange = vi.fn();

  // Sample supplier data
  const suppliers: SupplierOption[] = [
    { id: '1', label: 'Supplier A' },
    { id: '2', label: 'Supplier B' },
    { id: '3', label: 'Supplier C' },
  ];

  // Helper function to render component with default props
  const renderFilters = (props = {}) => {
    const defaultProps = {
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
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders supplier select dropdown', () => {
    // Verify that the supplier selection dropdown is rendered
    renderFilters();
    const supplierSelect = screen.getByRole('combobox');
    expect(supplierSelect).toBeInTheDocument();
  });

  it('renders search input field', () => {
    // Verify that search input for filtering items is rendered
    renderFilters();
    const searchInput = screen.getByLabelText('Search items...');
    expect(searchInput).toBeInTheDocument();
  });

  it('displays all supplier options in dropdown', () => {
    // Verify that all suppliers are available in the dropdown menu
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
    // Verify that supplier change callback is triggered on selection
    renderFilters();
    const supplierSelect = screen.getByRole('combobox');
    fireEvent.mouseDown(supplierSelect);
    
    const supplierOption = screen.getByText('Supplier A');
    fireEvent.click(supplierOption);
    
    expect(mockOnSupplierChange).toHaveBeenCalled();
  });

  it('calls onQChange when search text is entered', () => {
    // Verify that search change callback is triggered on input
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
    // Verify that selected supplier ID is reflected in dropdown
    renderFilters({ supplierId: '1' });
    const supplierSelect = screen.getByRole('combobox');
    expect(supplierSelect).toHaveTextContent('Supplier A');
  });

  it('shows loading spinner when suppliers are loading', () => {
    // Verify that loading indicator appears while suppliers are being fetched
    renderFilters({ supplierLoading: true });
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('disables supplier select when loading', () => {
    // Verify that supplier dropdown is disabled during loading
    renderFilters({ supplierLoading: true });
    const supplierSelect = screen.getByRole('combobox');
    // MUI Select uses aria-disabled instead of the disabled attribute on the div wrapper
    expect(supplierSelect).toHaveAttribute('aria-disabled', 'true');
  });

  it('disables search input when disableSearchUntilSupplier is true and no supplier selected', () => {
    // Verify that search is disabled until a supplier is selected
    renderFilters({
      disableSearchUntilSupplier: true,
      supplierId: '',
    });
    const searchInput = screen.getByLabelText('Search items...') as HTMLInputElement;
    expect(searchInput).toBeDisabled();
  });

  it('enables search input when supplier is selected', () => {
    // Verify that search becomes enabled once a supplier is selected
    renderFilters({
      disableSearchUntilSupplier: true,
      supplierId: 1,
    });
    const searchInput = screen.getByLabelText('Search items...') as HTMLInputElement;
    expect(searchInput).not.toBeDisabled();
  });

  it('renders layout container', () => {
    // Verify that layout container (Stack) is rendered
    renderFilters();
    const stack = document.querySelector('.MuiStack-root');
    expect(stack).toBeInTheDocument();
  });
});
