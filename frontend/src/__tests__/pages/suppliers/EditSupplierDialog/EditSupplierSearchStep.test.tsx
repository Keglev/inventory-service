/**
 * @file EditSupplierSearchStep.test.tsx
 * @module __tests__/pages/suppliers/EditSupplierDialog/EditSupplierSearchStep
 * @description Contract tests for the `EditSupplierSearchStep` presentation component.
 *
 * Contract under test:
 * - Renders the step heading.
 * - Hands query, results, loading and both callbacks to the shared
 *   SupplierSearchField unchanged.
 *
 * Out of scope:
 * - The field's own behavior (SupplierSearchField.test.tsx).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditSupplierSearchStep } from '@/pages/suppliers/dialogs/EditSupplierDialog/EditSupplierSearchStep';
import { supplierRow } from '@/__tests__/pages/suppliers/EditSupplierDialog/fixtures';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));

const fieldSpy = vi.hoisted(() => vi.fn());
vi.mock('@/pages/suppliers/components/SupplierSearchField', () => ({
  SupplierSearchField: (props: unknown) => {
    fieldSpy(props);
    return <div data-testid="supplier-search-field" />;
  },
}));

describe('EditSupplierSearchStep', () => {
  it('renders the heading and wires the shared search field', () => {
    const results = [supplierRow({ name: 'Acme Corp' })];
    const onSearchQueryChange = vi.fn();
    const onSelectSupplier = vi.fn();

    render(
      <EditSupplierSearchStep
        searchQuery="Ac"
        onSearchQueryChange={onSearchQueryChange}
        searchResults={results}
        searchLoading
        onSelectSupplier={onSelectSupplier}
      />
    );

    expect(screen.getByText('Step 1: Search and Select Supplier')).toBeInTheDocument();
    expect(fieldSpy).toHaveBeenCalledWith({
      query: 'Ac',
      onQueryChange: onSearchQueryChange,
      results,
      loading: true,
      onSelect: onSelectSupplier,
    });
  });
});
