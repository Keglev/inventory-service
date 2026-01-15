/**
 * @file DeleteSupplierSearchResults.test.tsx
 *
 * @what_is_under_test DeleteSupplierSearchResults component
 * @responsibility Render search results list and propagate click events
 * @out_of_scope API integration, filtering logic
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { DeleteSupplierSearchResults } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchResults';

const suppliers: SupplierRow[] = [
  { id: '1', name: 'Supplier One', contactName: 'Jane', email: null, phone: null },
  { id: '2', name: 'Supplier Two', contactName: 'John', email: null, phone: null },
];

describe('DeleteSupplierSearchResults', () => {
  it('renders supplier names and contact info when results provided', () => {
    render(<DeleteSupplierSearchResults suppliers={suppliers} onSelectSupplier={vi.fn()} />);

    expect(screen.getByText('Supplier One')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Supplier Two')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('returns null when no suppliers available', () => {
    const { container } = render(
      <DeleteSupplierSearchResults suppliers={[]} onSelectSupplier={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('calls onSelectSupplier with clicked supplier', async () => {
    const user = userEvent.setup();
    const onSelectSupplier = vi.fn();

    render(<DeleteSupplierSearchResults suppliers={suppliers} onSelectSupplier={onSelectSupplier} />);

    await user.click(screen.getByText('Supplier Two'));
    expect(onSelectSupplier).toHaveBeenCalledWith(suppliers[1]);
  });
});
