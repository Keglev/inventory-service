/**
 * @file DeleteSupplierSearchEmpty.test.tsx
 * @module __tests__/components/pages/suppliers/DeleteSupplierDialog/DeleteSupplierSearchEmpty
 * @description Contract tests for the DeleteSupplierSearchEmpty presentation component.
 *
 * Contract under test:
 * - Returns null unless a search has been performed (`hasSearched=true`) and results are not loading.
 * - When applicable, shows a stable empty message (defaultValue "No suppliers found").
 *
 * Out of scope:
 * - Search state computation (performed by parent component/hook).
 * - MUI internals; assertions target visible text and null-render behavior.
 *
 * Test strategy:
 * - i18n `t()` is mocked to return fallback/defaultValue for deterministic strings.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';

vi.mock('react-i18next', () => ({
  // Prefer fallback/defaultValue to keep assertions stable across locales.
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback ?? key }),
}));

import { DeleteSupplierSearchEmpty } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/DeleteSupplierSearchEmpty';

// -------------------------------------
// Test helpers
// -------------------------------------
const renderEmpty = (overrides?: Partial<ComponentProps<typeof DeleteSupplierSearchEmpty>>) => {
  const props: ComponentProps<typeof DeleteSupplierSearchEmpty> = {
    hasSearched: false,
    isLoading: false,
    ...overrides,
  };

  return render(<DeleteSupplierSearchEmpty {...props} />);
};

describe('DeleteSupplierSearchEmpty', () => {
  it('renders message when search completed with no results', () => {
    renderEmpty({ hasSearched: true, isLoading: false });

    expect(screen.getByText('No suppliers found')).toBeInTheDocument();
  });

  it('renders nothing when search not yet performed', () => {
    const { container } = renderEmpty({ hasSearched: false, isLoading: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing while loading results', () => {
    const { container } = renderEmpty({ hasSearched: true, isLoading: true });
    expect(container).toBeEmptyDOMElement();
  });
});
