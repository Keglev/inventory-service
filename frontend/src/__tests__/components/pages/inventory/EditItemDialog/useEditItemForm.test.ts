/**
 * @file useEditItemForm.test.ts
 *
 * @what_is_under_test useEditItemForm hook - state and query orchestration
 * @responsibility Manage form state, queries, submission, cleanup, error handling
 * @out_of_scope UI rendering, dialog lifecycle, component composition
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEditItemForm } from '../../../../../pages/inventory/dialogs/EditItemDialog/useEditItemForm';
import * as inventoryHooksModule from '../../../../../api/inventory/hooks/useInventoryData';

// Mock dependencies
vi.mock('../../../../../api/inventory/mutations', () => ({
  renameItem: vi.fn(),
}));

vi.mock('../../../../../api/inventory/hooks/useInventoryData', () => ({
  useSuppliersQuery: vi.fn(),
  useItemSearchQuery: vi.fn(),
  useItemDetailsQuery: vi.fn(),
}));

vi.mock('../../../../../context/toast', () => ({
  useToast: () => vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

vi.mock('react-hook-form', () => {
  const actual = vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      control: {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit: (fn: any) => fn,
      formState: { errors: {}, isSubmitting: false },
      reset: vi.fn(),
      setValue: vi.fn(),
    }),
  };
});

describe('useEditItemForm', () => {
  let mockOnClose: ReturnType<typeof vi.fn>;
  let mockOnItemRenamed: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnClose = vi.fn();
    mockOnItemRenamed = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useSuppliersQuery).mockReturnValue({ isLoading: false, data: [] } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useItemSearchQuery).mockReturnValue({ isLoading: false, data: [] } as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(inventoryHooksModule.useItemDetailsQuery).mockReturnValue({ isLoading: false, data: null } as any);
  });

  describe('Initial state', () => {
    it('initializes with no supplier selected', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.selectedSupplier).toBeNull();
    });

    it('initializes with no item selected', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.selectedItem).toBeNull();
    });

    it('initializes with empty item query', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.itemQuery).toBe('');
    });

    it('initializes with no form error', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.formError).toBe('');
    });
  });

  describe('State setters', () => {
    it('allows setting selected supplier', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      const supplier = { id: '1', label: 'Test Supplier' };

      act(() => {
        result.current.setSelectedSupplier(supplier);
      });

      expect(result.current.selectedSupplier).toEqual(supplier);
    });

    it('provides all setter functions', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(typeof result.current.setSelectedItem).toBe('function');
      expect(typeof result.current.setItemQuery).toBe('function');
      expect(typeof result.current.setFormError).toBe('function');
    });
  });

  describe('Supplier change effects', () => {
    it('clears item when supplier changes', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      const supplier = { id: '1', label: 'Test Supplier' };
      const item = { id: 'item1', name: 'Test Item' };

      act(() => {
        result.current.setSelectedItem(item);
        result.current.setSelectedSupplier(supplier);
      });

      expect(result.current.selectedItem).toBeNull();
    });

    it('clears item query when supplier changes', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      const supplier = { id: '1', label: 'Test Supplier' };

      act(() => {
        result.current.setItemQuery('search');
        result.current.setSelectedSupplier(supplier);
      });

      expect(result.current.itemQuery).toBe('');
    });

    it('clears form error when supplier changes', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      const supplier = { id: '1', label: 'Test Supplier' };

      act(() => {
        result.current.setFormError('Error');
        result.current.setSelectedSupplier(supplier);
      });

      expect(result.current.formError).toBe('');
    });
  });

  describe('Close handler', () => {
    it('clears all state on close', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      const supplier = { id: '1', label: 'Test Supplier' };

      act(() => {
        result.current.setSelectedSupplier(supplier);
        result.current.setItemQuery('search');
        result.current.setFormError('Error');
        result.current.handleClose();
      });

      expect(result.current.selectedSupplier).toBeNull();
      expect(result.current.itemQuery).toBe('');
      expect(result.current.formError).toBe('');
    });

    it('calls onClose callback', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      act(() => {
        result.current.handleClose();
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Query integrations', () => {
    it('provides suppliers query', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.suppliersQuery).toBeDefined();
      expect(result.current.suppliersQuery.data).toEqual([]);
    });

    it('provides items query', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.itemsQuery).toBeDefined();
      expect(result.current.itemsQuery.data).toEqual([]);
    });

    it('provides item details query', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.itemDetailsQuery).toBeDefined();
      expect(result.current.itemDetailsQuery.data).toBeNull();
    });
  });

  describe('Form management', () => {
    it('provides control object', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.control).toBeDefined();
    });

    it('provides formState', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.formState).toBeDefined();
      expect(result.current.formState.errors).toEqual({});
    });

    it('provides setValue function', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(typeof result.current.setValue).toBe('function');
    });

    it('provides onSubmit function', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(typeof result.current.onSubmit).toBe('function');
    });
  });

  describe('Lifecycle', () => {
    it('initializes with correct defaults', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      expect(result.current.selectedSupplier).toBeNull();
      expect(result.current.selectedItem).toBeNull();
      expect(result.current.itemQuery).toBe('');
      expect(result.current.formError).toBe('');
    });

    it('handles multiple setter calls', () => {
      const { result } = renderHook(() =>
        useEditItemForm(true, mockOnClose, mockOnItemRenamed)
      );

      act(() => {
        result.current.setSelectedSupplier({ id: '1', label: 'Supplier A' });
      });

      expect(result.current.selectedSupplier?.id).toBe('1');
    });
  });
});
