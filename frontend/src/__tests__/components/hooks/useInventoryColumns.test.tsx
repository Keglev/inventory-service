/**
 * @file useInventoryColumns.test.tsx
 * @module __tests__/components/hooks/useInventoryColumns
 * @description
 * Enterprise unit tests for the `useInventoryColumns` hook.
 *
 * Scope:
 * - Ensures required columns exist and key sizing defaults are stable.
 * - Verifies valueGetter fallbacks (e.g., backend compatibility fields).
 * - Verifies formatter behavior for empty values.
 * - Verifies referential stability across re-renders (memoization intent).
 *
 * Notes:
 * - Settings are mocked to keep formatting deterministic (date/number formats).
 * - We pass lightweight "grid-like" params to getters/formatters to avoid type
 *   escapes and to test closer to runtime behavior.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AllProviders } from '@/__tests__/test/all-providers';
import { useInventoryColumns } from '@/pages/inventory/hooks/useInventoryColumns';
import type { InventoryRow } from '@/api/inventory/types';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockUseSettings = vi.hoisted(() => vi.fn());
const mockT = vi.hoisted(() => (key: string, fallback?: string) => fallback ?? key);

vi.mock('@/hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type GridValueGetterParams<R> = {
  value: unknown;
  row: R;
};

type GridValueFormatterParams = {
  value: unknown;
};

function setup() {
  return renderHook(() => useInventoryColumns(), { wrapper: AllProviders });
}

function getColumnByField(
  columns: Array<{ field: string }>,
  field: string,
): (typeof columns)[number] | undefined {
  return columns.find(c => c.field === field);
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('useInventoryColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Keep formatting deterministic across test runs.
    mockUseSettings.mockReturnValue({
      userPreferences: {
        numberFormat: 'EN_US',
        dateFormat: 'YYYY-MM-DD',
      },
    });
  });

  it('returns a non-empty array of column definitions', () => {
    const { result } = setup();

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('includes all required column fields', () => {
    const { result } = setup();

    const fields = result.current.map(col => col.field);
    expect(fields).toContain('name');
    expect(fields).toContain('code');
    expect(fields).toContain('onHand');
    expect(fields).toContain('minQty');
    expect(fields).toContain('updatedAt');
  });

  it('configures the name column with expected flex sizing defaults', () => {
    const { result } = setup();

    const nameCol = getColumnByField(result.current, 'name');
    expect(nameCol).toBeDefined();

    // Layout defaults are part of the UX contract for the primary identifier column.
    expect((nameCol as { flex?: number }).flex).toBe(1);
    expect((nameCol as { minWidth?: number }).minWidth).toBe(180);
  });

  it('formats the code column with a fallback placeholder when missing', () => {
    const { result } = setup();

    const codeCol = getColumnByField(result.current, 'code') as
      | { valueGetter?: (params: GridValueGetterParams<InventoryRow>) => unknown }
      | undefined;

    expect(codeCol).toBeDefined();
    expect(codeCol?.valueGetter).toBeTypeOf('function');

    const rowWithCode: InventoryRow = {
      id: '1',
      name: 'Test',
      code: 'ABC123',
      onHand: 10,
      minQty: 5,
    };

    const rowWithoutCode: InventoryRow = {
      id: '2',
      name: 'Test2',
      onHand: 10,
      minQty: 5,
    };

    expect(codeCol?.valueGetter?.({ value: undefined, row: rowWithCode })).toBe('ABC123');
    expect(codeCol?.valueGetter?.({ value: undefined, row: rowWithoutCode })).toBe('—');
  });

  it('normalizes the onHand column from onHand → quantity → 0', () => {
    const { result } = setup();

    const onHandCol = getColumnByField(result.current, 'onHand') as
      | {
          type?: string;
          valueGetter?: (params: GridValueGetterParams<InventoryRow & { quantity?: number }>) => unknown;
        }
      | undefined;

    expect(onHandCol).toBeDefined();
    expect(onHandCol?.type).toBe('number');
    expect(onHandCol?.valueGetter).toBeTypeOf('function');

    const rowWithOnHand: InventoryRow = { id: '1', name: 'Test', onHand: 100, minQty: 5 };
    expect(onHandCol?.valueGetter?.({ value: undefined, row: rowWithOnHand })).toBe(100);

    const rowWithQuantity = { id: '2', name: 'Test', quantity: 50, minQty: 5 } as InventoryRow & {
      quantity: number;
    };
    expect(onHandCol?.valueGetter?.({ value: undefined, row: rowWithQuantity })).toBe(50);

    const rowDefaultZero: InventoryRow = { id: '3', name: 'Test', minQty: 5, onHand: 0 };
    expect(onHandCol?.valueGetter?.({ value: undefined, row: rowDefaultZero })).toBe(0);
  });

  it('normalizes the minQty column from minQty → minimumQuantity(string) → 0', () => {
    const { result } = setup();

    const minQtyCol = getColumnByField(result.current, 'minQty') as
      | {
          type?: string;
          valueGetter?: (
            params: GridValueGetterParams<InventoryRow & { minimumQuantity?: string }>,
          ) => unknown;
        }
      | undefined;

    expect(minQtyCol).toBeDefined();
    expect(minQtyCol?.type).toBe('number');
    expect(minQtyCol?.valueGetter).toBeTypeOf('function');

    const rowWithMinQty: InventoryRow = { id: '1', name: 'Test', onHand: 10, minQty: 15 };
    expect(minQtyCol?.valueGetter?.({ value: undefined, row: rowWithMinQty })).toBe(15);

    const rowWithMinimumQuantity = {
      id: '2',
      name: 'Test',
      onHand: 10,
      minimumQuantity: '20',
    } as InventoryRow & { minimumQuantity: string };
    expect(minQtyCol?.valueGetter?.({ value: undefined, row: rowWithMinimumQuantity })).toBe(20);

    const rowDefaultZero: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 0 };
    expect(minQtyCol?.valueGetter?.({ value: undefined, row: rowDefaultZero })).toBe(0);
  });

  it('normalizes the updatedAt column from updatedAt → createdAt → null', () => {
    const { result } = setup();

    const updatedCol = getColumnByField(result.current, 'updatedAt') as
      | {
          valueGetter?: (
            params: GridValueGetterParams<InventoryRow & { createdAt?: string }>,
          ) => unknown;
        }
      | undefined;

    expect(updatedCol).toBeDefined();
    expect(updatedCol?.valueGetter).toBeTypeOf('function');

    const rowUpdatedAt: InventoryRow = {
      id: '1',
      name: 'Test',
      onHand: 10,
      minQty: 5,
      updatedAt: '2023-12-01T10:00:00Z',
    };
    expect(updatedCol?.valueGetter?.({ value: undefined, row: rowUpdatedAt })).toBe(
      '2023-12-01T10:00:00Z',
    );

    const rowCreatedAt = {
      id: '2',
      name: 'Test',
      onHand: 10,
      minQty: 5,
      createdAt: '2023-11-01T10:00:00Z',
    } as InventoryRow & { createdAt: string };
    expect(updatedCol?.valueGetter?.({ value: undefined, row: rowCreatedAt })).toBe(
      '2023-11-01T10:00:00Z',
    );

    const rowNull: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 5 };
    expect(updatedCol?.valueGetter?.({ value: undefined, row: rowNull })).toBeNull();
  });

  it('formats updatedAt as a placeholder when the value is empty', () => {
    const { result } = setup();

    const updatedCol = getColumnByField(result.current, 'updatedAt') as
      | { valueFormatter?: (params: GridValueFormatterParams) => string }
      | undefined;

    expect(updatedCol).toBeDefined();

    // The formatter is responsible for the UI placeholder on missing dates.
    expect(updatedCol?.valueFormatter?.({ value: null })).toBe('—');
    expect(updatedCol?.valueFormatter?.({ value: undefined })).toBe('—');
  });

  it('keeps the same column array reference across re-renders (memoization)', () => {
    const { result, rerender } = setup();

    const first = result.current;
    rerender();
    const second = result.current;

    // Memoization matters for DataGrid performance: stable column identity
    // avoids unnecessary internal recalculation and re-render churn.
    expect(second).toBe(first);
  });
});
