/**
 * @file DeleteSupplierSearchEmpty.test.tsx
 *
 * @what_is_under_test DeleteSupplierSearchEmpty component
 * @responsibility Display empty state message based on search status
 * @out_of_scope Search state management
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearchEmpty } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchEmpty';

describe('DeleteSupplierSearchEmpty', () => {
  it('renders message when search completed with no results', () => {
    render(<DeleteSupplierSearchEmpty hasSearched={true} isLoading={false} />);

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });

  it('renders nothing when search not yet performed', () => {
    const { container } = render(<DeleteSupplierSearchEmpty hasSearched={false} isLoading={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while loading results', () => {
    const { container } = render(<DeleteSupplierSearchEmpty hasSearched={true} isLoading={true} />);
    expect(container).toBeEmptyDOMElement();
  });
});
