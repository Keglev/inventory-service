/**
 * @file useSuppliersBoardData.test.ts
 * @module __tests__/pages/suppliers/hooks/useSuppliersBoardData
 *
 * @summary
 * Test suite for useSuppliersBoardData hook.
 * Tests: data fetching, pagination, search, error handling, loading states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSuppliersBoardData } from '../../../../../pages/suppliers/hooks/useSuppliersBoardData';
import { useSuppliersPageQuery, useSupplierSearchQuery } from '../../../../../api/suppliers';
import type { SupplierRow } from '../../../../../api/suppliers';

// Mock the API hooks
vi.mock('../../../../../api/suppliers', () => ({
  useSuppliersPageQuery: vi.fn(),
  useSupplierSearchQuery: vi.fn(),
}));

describe('useSuppliersBoardData', () => {
  const mockSuppliers: SupplierRow[] = [
    {
      id: '1',
      name: 'Acme Corp',
      contactName: 'John Doe',
      email: 'john@acme.com',
      phone: '123-456-7890',
      createdBy: 'admin',
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      name: 'Tech Supplies Inc',
      contactName: 'Jane Smith',
      email: 'jane@techsupplies.com',
      phone: '098-765-4321',
      createdBy: 'admin',
      createdAt: '2024-02-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch suppliers with pagination', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: mockSuppliers, total: 2 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    // Assert
    expect(result.current.suppliers).toEqual(mockSuppliers);
    expect(result.current.total).toBe(2);
    expect(result.current.isLoadingSuppliers).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle empty suppliers list', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    // Assert
    expect(result.current.suppliers).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should fetch search results when query has 2+ characters', () => {
    // Arrange
    const searchResults = [mockSuppliers[0]];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: mockSuppliers, total: 2 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: searchResults,
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', 'acme', false)
    );

    // Assert
    expect(result.current.searchResults).toEqual(searchResults);
    expect(result.current.isLoadingSearch).toBe(false);
  });

  it('should handle loading state for suppliers', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    // Assert
    expect(result.current.isLoadingSuppliers).toBe(true);
    expect(result.current.suppliers).toEqual([]);
  });

  it('should handle loading state for search', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: mockSuppliers, total: 2 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: true,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', 'test', false)
    );

    // Assert
    expect(result.current.isLoadingSearch).toBe(true);
    expect(result.current.searchResults).toEqual([]);
  });

  it('should handle error state', () => {
    // Arrange
    const errorMessage = 'Failed to fetch suppliers';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error(errorMessage),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    // Assert
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.suppliers).toEqual([]);
  });

  it('should pass correct parameters to useSuppliersPageQuery', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    renderHook(() =>
      useSuppliersBoardData(2, 25, 'lastContact,desc', 'test', true)
    );

    // Assert
    expect(useSuppliersPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        pageSize: 25,
        sort: 'lastContact,desc',
        q: 'test',
      }),
      true
    );
  });

  it('should exclude search query from pagination when showAllSuppliers is false', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: { items: [], total: 0 },
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: [],
      isLoading: false,
    });

    // Act
    renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', 'test', false)
    );

    // Assert
    expect(useSuppliersPageQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        q: undefined,
      }),
      true
    );
  });

  it('should handle null data from queries gracefully', () => {
    // Arrange
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSuppliersPageQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (useSupplierSearchQuery as any).mockReturnValue({
      data: null,
      isLoading: false,
    });

    // Act
    const { result } = renderHook(() =>
      useSuppliersBoardData(1, 10, 'name,asc', '', false)
    );

    // Assert
    expect(result.current.suppliers).toEqual([]);
    expect(result.current.total).toBe(0);
    expect(result.current.searchResults).toEqual([]);
  });
});
