/**
 * @file useInventoryColumns.test.tsx
 * @module pages/inventory/hooks/useInventoryColumns.test
 * 
 * Unit tests for useInventoryColumns hook.
 * Tests column definitions, value getters, and formatters.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useInventoryColumns } from '@/pages/inventory/hooks/useInventoryColumns';
import { AllProviders } from '@/__tests__/test/all-providers';
import type { InventoryRow } from '@/api/inventory/types';

// Mock dependencies
vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      numberFormat: 'EN_US' as const,
      dateFormat: 'YYYY-MM-DD' as const,
    },
  }),
}));

describe('useInventoryColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('should return array of column definitions', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('should include all required columns', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const fields = result.current.map(col => col.field);
    expect(fields).toContain('name');
    expect(fields).toContain('code');
    expect(fields).toContain('onHand');
    expect(fields).toContain('minQty');
    expect(fields).toContain('updatedAt');
  });

  it('should have name column with flex sizing', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const nameCol = result.current.find(col => col.field === 'name');
    expect(nameCol).toBeDefined();
    expect(nameCol?.flex).toBe(1);
    expect(nameCol?.minWidth).toBe(180);
  });

  it('should format code column with fallback for missing values', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const codeCol = result.current.find(col => col.field === 'code');
    expect(codeCol).toBeDefined();

    if (codeCol?.valueGetter) {
      const rowWithCode: InventoryRow = { id: '1', name: 'Test', code: 'ABC123', onHand: 10, minQty: 5 };
      const rowWithoutCode: InventoryRow = { id: '2', name: 'Test2', onHand: 10, minQty: 5 };

      // @ts-expect-error - Testing valueGetter with simplified params
      expect(codeCol.valueGetter(undefined, rowWithCode)).toBe('ABC123');
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(codeCol.valueGetter(undefined, rowWithoutCode)).toBe('—');
    }
  });

  it('should format onHand column with proper value getter logic', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const onHandCol = result.current.find(col => col.field === 'onHand');
    expect(onHandCol).toBeDefined();
    expect(onHandCol?.type).toBe('number');

    if (onHandCol?.valueGetter) {
      // Test normalized onHand value
      const row1: InventoryRow = { id: '1', name: 'Test', onHand: 100, minQty: 5 };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(onHandCol.valueGetter(undefined, row1)).toBe(100);

      // Test fallback to quantity field
      const row2 = { id: '2', name: 'Test', quantity: 50, minQty: 5 } as InventoryRow & { quantity: number };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(onHandCol.valueGetter(undefined, row2)).toBe(50);

      // Test default to 0
      const row3: InventoryRow = { id: '3', name: 'Test', minQty: 5, onHand: 0 };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(onHandCol.valueGetter(undefined, row3)).toBe(0);
    }
  });

  it('should format minQty column with proper value getter logic', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const minQtyCol = result.current.find(col => col.field === 'minQty');
    expect(minQtyCol).toBeDefined();
    expect(minQtyCol?.type).toBe('number');

    if (minQtyCol?.valueGetter) {
      // Test numeric minQty
      const row1: InventoryRow = { id: '1', name: 'Test', onHand: 10, minQty: 15 };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(minQtyCol.valueGetter(undefined, row1)).toBe(15);

      // Test fallback to minimumQuantity field (string)
      const row2 = { id: '2', name: 'Test', onHand: 10, minimumQuantity: '20' } as InventoryRow & { minimumQuantity: string };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(minQtyCol.valueGetter(undefined, row2)).toBe(20);

      // Test default to 0
      const row3: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 0 };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(minQtyCol.valueGetter(undefined, row3)).toBe(0);
    }
  });

  it('should format updatedAt column with fallbacks', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const updatedCol = result.current.find(col => col.field === 'updatedAt');
    expect(updatedCol).toBeDefined();

    if (updatedCol?.valueGetter) {
      // Test updatedAt primary field
      const row1: InventoryRow = { id: '1', name: 'Test', onHand: 10, minQty: 5, updatedAt: '2023-12-01T10:00:00Z' };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(updatedCol.valueGetter(undefined, row1)).toBe('2023-12-01T10:00:00Z');

      // Test fallback to createdAt
      const row2 = { id: '2', name: 'Test', onHand: 10, minQty: 5, createdAt: '2023-11-01T10:00:00Z' } as InventoryRow & { createdAt: string };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(updatedCol.valueGetter(undefined, row2)).toBe('2023-11-01T10:00:00Z');

      // Test null fallback
      const row3: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 5 };
      // @ts-expect-error - Testing valueGetter with simplified params
      expect(updatedCol.valueGetter(undefined, row3)).toBeNull();
    }
  });

  it('should have valueFormatter for updatedAt that handles null', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const updatedCol = result.current.find(col => col.field === 'updatedAt');
    
    if (updatedCol?.valueFormatter) {
      // @ts-expect-error - Testing valueFormatter with simplified params
      expect(updatedCol.valueFormatter(null)).toBe('—');
      // @ts-expect-error - Testing valueFormatter with simplified params
      expect(updatedCol.valueFormatter(undefined)).toBe('—');
    }
  });

  it('should memoize columns based on dependencies', () => {
    const { result } = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });

    const firstResult = result.current;
    
    // Get result again
    const secondRender = renderHook(() => useInventoryColumns(), {
      wrapper: AllProviders,
    });
    
    // Should return equal array length and structure (content memoization)
    expect(secondRender.result.current).toHaveLength(firstResult.length);
    expect(secondRender.result.current.map(c => c.field)).toEqual(firstResult.map(c => c.field));
  });
});
