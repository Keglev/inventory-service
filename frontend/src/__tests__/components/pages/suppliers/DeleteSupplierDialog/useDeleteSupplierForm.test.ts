/**
 * @file useDeleteSupplierForm.test.ts
 *
 * @what_is_under_test useDeleteSupplierForm hook
 * @responsibility Manage deletion workflow, selection, and confirmation state
 * @out_of_scope Component rendering, API layer, search functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('../../../../../api/suppliers', () => ({
  deleteSupplier: vi.fn(),
}));

vi.mock('../../../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'ADMIN' },
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('./useSupplierSearch.ts', () => ({
  useSupplierSearch: () => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    searchResults: [],
    searchLoading: false,
    handleSearchQueryChange: vi.fn(),
    resetSearch: vi.fn(),
  }),
}));

import { useDeleteSupplierForm } from '../../../../../pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm';

describe('useDeleteSupplierForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));
    expect(result.current).toBeDefined();
    expect(result.current.selectedSupplier).toBeNull();
    expect(result.current.showConfirmation).toBe(false);
  });

  it('initializes with empty search query', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));
    expect(result.current.searchQuery).toBe('');
  });

  it('initializes with not deleting state', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));
    expect(result.current.isDeleting).toBe(false);
  });

  it('initializes with no error', () => {
    const { result } = renderHook(() => useDeleteSupplierForm(vi.fn()));
    expect(result.current.error).toBeNull();
  });
});
