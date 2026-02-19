/**
 * @file DeleteSupplierSearchResults.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierSearchResults
 * @description Contract tests for the DeleteSupplierSearchResults presentation component.
 *
 * Contract under test:
 * - Returns null when the supplier list is empty.
 * - When suppliers are provided, renders supplier name and optional contact name.
 * - Clicking a supplier triggers `onSelectSupplier(supplier)`.
 *
 * Out of scope:
 * - API/search logic and filtering/sorting rules.
 * - MUI styling/hover effects.
 *
 * Test strategy:
 * - Assertions focus on visible text and click delegation (public behavior).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import type { SupplierRow } from '../../../../../api/suppliers/types';

import { DeleteSupplierSearchResults } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchResults';

const suppliers: SupplierRow[] = [
  { id: '1', name: 'Supplier One', contactName: 'Jane', email: null, phone: null },
  { id: '2', name: 'Supplier Two', contactName: 'John', email: null, phone: null },
];

// -------------------------------------
// Test helpers
// -------------------------------------
const renderResults = (
  overrides?: Partial<ComponentProps<typeof DeleteSupplierSearchResults>>
) => {
  const props: ComponentProps<typeof DeleteSupplierSearchResults> = {
    suppliers: [],
    onSelectSupplier: vi.fn(),
    ...overrides,
  };

  return { ...render(<DeleteSupplierSearchResults {...props} />), props };
};

describe('DeleteSupplierSearchResults', () => {
  it('renders supplier names and contact info when results provided', () => {
    renderResults({ suppliers });

    expect(screen.getByText('Supplier One')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Supplier Two')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('returns null when no suppliers available', () => {
    const { container } = renderResults({ suppliers: [] });

    expect(container).toBeEmptyDOMElement();
  });

  it('calls onSelectSupplier with clicked supplier', async () => {
    const user = userEvent.setup();
    const onSelectSupplier = vi.fn();

    renderResults({ suppliers, onSelectSupplier });

    await user.click(screen.getByText('Supplier Two'));
    expect(onSelectSupplier).toHaveBeenCalledWith(suppliers[1]);
  });
});
