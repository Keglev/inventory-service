import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuppliersSearchPanel } from '../../../../pages/suppliers/components/SuppliersSearchPanel';
import type { SupplierRow } from '../../../../api/suppliers';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('SuppliersSearchPanel', () => {
  const mockSearchResults: SupplierRow[] = [
    {
      id: '1',
      name: 'Supplier A',
      contactName: 'John Doe',
      phone: '123-456-7890',
      email: 'john@suppliera.com',
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Supplier B',
      contactName: null,
      phone: '987-654-3210',
      email: null,
      createdAt: '2024-02-20T14:30:00Z',
    },
  ];

  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    isLoading: false,
    searchResults: [],
    onResultSelect: vi.fn(),
    selectedSupplier: null,
    onClearSelection: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search panel title', () => {
    render(<SuppliersSearchPanel {...defaultProps} />);
    expect(screen.getByText('suppliers:search.title')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<SuppliersSearchPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('suppliers:search.placeholder');
    expect(input).toBeInTheDocument();
  });

  it('displays search query value', () => {
    render(<SuppliersSearchPanel {...defaultProps} searchQuery="test" />);
    const input = screen.getByDisplayValue('test');
    expect(input).toBeInTheDocument();
  });

  it('calls onSearchChange when input changes', async () => {
    const user = userEvent.setup();
    render(<SuppliersSearchPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('suppliers:search.placeholder');
    await user.type(input, 'supplier');
    expect(defaultProps.onSearchChange).toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(<SuppliersSearchPanel {...defaultProps} isLoading={true} />);
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toBeInTheDocument();
  });

  it('does not show loading indicator when isLoading is false', () => {
    render(<SuppliersSearchPanel {...defaultProps} isLoading={false} />);
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).not.toBeInTheDocument();
  });

  it('displays search results dropdown when results exist and no selection', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        searchResults={mockSearchResults}
      />
    );
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText('Supplier B')).toBeInTheDocument();
  });

  it('shows email in search result secondary text when available', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        searchResults={mockSearchResults}
      />
    );
    expect(screen.getByText('john@suppliera.com')).toBeInTheDocument();
  });

  it('shows phone in search result secondary text when email not available', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        searchResults={mockSearchResults}
      />
    );
    expect(screen.getByText('987-654-3210')).toBeInTheDocument();
  });

  it('calls onResultSelect when a search result is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        searchResults={mockSearchResults}
      />
    );
    const resultItem = screen.getByText('Supplier A');
    await user.click(resultItem);
    expect(defaultProps.onResultSelect).toHaveBeenCalledWith(mockSearchResults[0]);
  });

  it('does not display dropdown when supplier is selected', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        searchResults={mockSearchResults}
        selectedSupplier={mockSearchResults[0]}
      />
    );
    const dropdown = screen.queryByRole('list');
    expect(dropdown).not.toBeInTheDocument();
  });

  it('displays selected supplier info when supplier is selected', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        selectedSupplier={mockSearchResults[0]}
      />
    );
    expect(screen.getByText('Supplier A')).toBeInTheDocument();
    expect(screen.getByText(/suppliers:table.contactName.*John Doe/)).toBeInTheDocument();
    expect(screen.getByText('123-456-7890')).toBeInTheDocument();
    expect(screen.getByText('john@suppliera.com')).toBeInTheDocument();
  });

  it('displays clear button when supplier is selected', () => {
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        selectedSupplier={mockSearchResults[0]}
      />
    );
    expect(screen.getByText('suppliers:actions.clear')).toBeInTheDocument();
  });

  it('calls onClearSelection when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SuppliersSearchPanel
        {...defaultProps}
        selectedSupplier={mockSearchResults[0]}
      />
    );
    const clearButton = screen.getByText('suppliers:actions.clear');
    await user.click(clearButton);
    expect(defaultProps.onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('does not display selected info when no supplier is selected', () => {
    render(<SuppliersSearchPanel {...defaultProps} />);
    const clearButton = screen.queryByText('suppliers:actions.clear');
    expect(clearButton).not.toBeInTheDocument();
  });
});
