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

// MUI DataGrid v7+ valueGetter signature: (value, row) => result
type ValueGetter<R> = (value: unknown, row: R | null) => unknown;
// MUI DataGrid v7+ valueFormatter signature: (value) => string
type ValueFormatter = (value: unknown) => string;

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
    expect(fields).toContain('createdAt');
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
      | { valueGetter?: ValueGetter<InventoryRow> }
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

    expect(codeCol?.valueGetter?.(undefined, rowWithCode)).toBe('ABC123');
    expect(codeCol?.valueGetter?.(undefined, rowWithoutCode)).toBe('—');
  });

  it('normalizes the onHand column from onHand → quantity → 0', () => {
    const { result } = setup();

    const onHandCol = getColumnByField(result.current, 'onHand') as
      | {
          type?: string;
          valueGetter?: ValueGetter<InventoryRow & { quantity?: number }>;
        }
      | undefined;

    expect(onHandCol).toBeDefined();
    expect(onHandCol?.type).toBe('number');
    expect(onHandCol?.valueGetter).toBeTypeOf('function');

    const rowWithOnHand: InventoryRow = { id: '1', name: 'Test', onHand: 100, minQty: 5 };
    expect(onHandCol?.valueGetter?.(undefined, rowWithOnHand)).toBe(100);

    const rowWithQuantity = { id: '2', name: 'Test', quantity: 50, minQty: 5 } as InventoryRow & {
      quantity: number;
    };
    expect(onHandCol?.valueGetter?.(undefined, rowWithQuantity)).toBe(50);

    const rowDefaultZero: InventoryRow = { id: '3', name: 'Test', minQty: 5, onHand: 0 };
    expect(onHandCol?.valueGetter?.(undefined, rowDefaultZero)).toBe(0);
  });

  it('normalizes the minQty column from minQty → minimumQuantity(string) → 0', () => {
    const { result } = setup();

    const minQtyCol = getColumnByField(result.current, 'minQty') as
      | {
          type?: string;
          valueGetter?: ValueGetter<InventoryRow & { minimumQuantity?: string }>;
        }
      | undefined;

    expect(minQtyCol).toBeDefined();
    expect(minQtyCol?.type).toBe('number');
    expect(minQtyCol?.valueGetter).toBeTypeOf('function');

    const rowWithMinQty: InventoryRow = { id: '1', name: 'Test', onHand: 10, minQty: 15 };
    expect(minQtyCol?.valueGetter?.(undefined, rowWithMinQty)).toBe(15);

    const rowWithMinimumQuantity = {
      id: '2',
      name: 'Test',
      onHand: 10,
      minimumQuantity: '20',
    } as InventoryRow & { minimumQuantity: string };
    expect(minQtyCol?.valueGetter?.(undefined, rowWithMinimumQuantity)).toBe(20);

    const rowDefaultZero: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 0 };
    expect(minQtyCol?.valueGetter?.(undefined, rowDefaultZero)).toBe(0);
  });

  it('reads the createdAt column value, else null', () => {
    const { result } = setup();

    const createdCol = getColumnByField(result.current, 'createdAt') as
      | { valueGetter?: ValueGetter<InventoryRow> }
      | undefined;

    expect(createdCol).toBeDefined();
    expect(createdCol?.valueGetter).toBeTypeOf('function');

    const rowCreatedAt: InventoryRow = {
      id: '1',
      name: 'Test',
      onHand: 10,
      minQty: 5,
      createdAt: '2023-11-01T10:00:00Z',
    };
    expect(createdCol?.valueGetter?.(undefined, rowCreatedAt)).toBe(
      '2023-11-01T10:00:00Z',
    );

    const rowNull: InventoryRow = { id: '3', name: 'Test', onHand: 10, minQty: 5 };
    expect(createdCol?.valueGetter?.(undefined, rowNull)).toBeNull();
  });

  it('formats createdAt as a placeholder when the value is empty', () => {
    const { result } = setup();

    const createdCol = getColumnByField(result.current, 'createdAt') as
      | { valueFormatter?: ValueFormatter }
      | undefined;

    expect(createdCol).toBeDefined();

    // The formatter is responsible for the UI placeholder on missing dates.
    expect(createdCol?.valueFormatter?.(null)).toBe('—');
    expect(createdCol?.valueFormatter?.(undefined)).toBe('—');
  });

  it('resolves the price column to the unit price or null', () => {
    const { result } = setup();

    const priceCol = getColumnByField(result.current, 'price') as
      | { valueGetter?: ValueGetter<InventoryRow>; valueFormatter?: ValueFormatter }
      | undefined;

    expect(priceCol?.valueGetter?.(undefined, {
      id: '1', name: 'T', onHand: 1, minQty: 1, price: 2.5,
    } as InventoryRow)).toBe(2.5);
    expect(priceCol?.valueGetter?.(undefined, {
      id: '2', name: 'T2', onHand: 1, minQty: 1,
    } as InventoryRow)).toBeNull();
    expect(priceCol?.valueGetter?.(undefined, null)).toBeNull();
  });

  it('resolves the totalValue column from the server total or price x onHand', () => {
    const { result } = setup();

    const totalCol = getColumnByField(result.current, 'totalValue') as
      | { valueGetter?: ValueGetter<InventoryRow>; sortable?: boolean }
      | undefined;

    // Server-computed column cannot participate in server-side sorting.
    expect(totalCol?.sortable).toBe(false);
    expect(totalCol?.valueGetter?.(undefined, {
      id: '1', name: 'T', onHand: 3, minQty: 1, price: 2, totalValue: 42,
    } as InventoryRow)).toBe(42);
    expect(totalCol?.valueGetter?.(undefined, {
      id: '2', name: 'T2', onHand: 4, minQty: 1, price: 2.5,
    } as InventoryRow)).toBe(10);
    expect(totalCol?.valueGetter?.(undefined, null)).toBeNull();
  });

  it('formats counts, money, and dates through the preference-bound formatters', () => {
    const { result } = setup();

    const fmt = (field: string): ValueFormatter =>
      (getColumnByField(result.current, field) as { valueFormatter?: ValueFormatter })
        .valueFormatter as ValueFormatter;

    // EN_US preference from the mocked settings.
    expect(fmt('onHand')(1234)).toBe('1,234');
    expect(fmt('minQty')('12')).toBe('12');
    expect(fmt('price')(1234.5)).toBe('1,234.50');
    expect(fmt('price')(null)).toBe('—');
    expect(fmt('totalValue')(10)).toBe('10.00');
    expect(fmt('createdAt')('2026-05-01T00:00:00Z')).toBe('2026-05-01');
  });

  it('guards the createdAt getter against a null row', () => {
    const { result } = setup();

    const createdCol = getColumnByField(result.current, 'createdAt') as
      | { valueGetter?: ValueGetter<InventoryRow> }
      | undefined;

    expect(createdCol?.valueGetter?.(undefined, null)).toBeNull();
    expect(createdCol?.valueGetter?.(undefined, {
      id: '1', name: 'T', onHand: 1, minQty: 1,
    } as InventoryRow)).toBeNull();
    expect(createdCol?.valueGetter?.(undefined, {
      id: '2', name: 'T2', onHand: 1, minQty: 1, createdAt: '2026-05-01',
    } as InventoryRow)).toBe('2026-05-01');
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
