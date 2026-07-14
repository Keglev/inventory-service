/**
 * @file useSupplierColumns.test.tsx
 * @module __tests__/components/hooks/useSupplierColumns
 * @testing Unit tests for the `useSupplierColumns` hook.
 * @description
 * Contract under test:
 * - Every column the suppliers grid renders is present, with its sizing contract.
 * - Nullable contact fields resolve to a placeholder glyph rather than an empty cell.
 * - The createdAt cell reads the raw backend timestamp and formats it through the
 *   user's date preference, degrading to the placeholder when it cannot be read.
 * - The column array keeps its identity across re-renders (memoization intent).
 *
 * Out of scope:
 * - Grid rendering, pagination and sorting wiring (SuppliersTable contract tests).
 * - Date-format correctness itself (formatters unit tests).
 *
 * Test strategy:
 * - Settings and the translator are mocked so formatting is deterministic.
 * - Column callbacks are invoked directly: the DataGrid test double never calls
 *   them, which is the whole reason this logic lives in a hook.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { AllProviders } from '@/__tests__/test/all-providers';
import { useSupplierColumns } from '@/pages/suppliers/hooks/useSupplierColumns';
import type { SupplierRow } from '@/api/suppliers/types';

const mockUseSettings = vi.hoisted(() => vi.fn());
const mockT = vi.hoisted(() => (key: string) => key);

vi.mock('@/hooks/useSettings', () => ({
  useSettings: mockUseSettings,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

const EM_DASH = '\u2014';

// MUI DataGrid v7+ callback signatures.
type ValueGetter = (value: unknown, row: SupplierRow | null) => unknown;
type ValueFormatter = (value: unknown) => string;

const setup = () => renderHook(() => useSupplierColumns(), { wrapper: AllProviders });

const columnByField = (
  columns: Array<{ field: string }>,
  field: string
): { valueGetter?: ValueGetter; valueFormatter?: ValueFormatter } =>
  columns.find((c) => c.field === field) as {
    valueGetter?: ValueGetter;
    valueFormatter?: ValueFormatter;
  };

const supplier = (overrides: Partial<SupplierRow> = {}): SupplierRow => ({
  id: '1',
  name: 'Acme GmbH',
  contactName: 'Jane Doe',
  phone: '+49 911 000000',
  email: 'jane@acme.de',
  createdAt: '2026-05-01T00:00:00Z',
  ...overrides,
});

describe('useSupplierColumns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSettings.mockReturnValue({
      userPreferences: { dateFormat: 'YYYY-MM-DD', tableDensity: 'comfortable' },
    });
  });

  it('exposes every column the suppliers grid renders', () => {
    const { result } = setup();

    expect(result.current.map((c) => c.field)).toEqual([
      'name',
      'contactName',
      'phone',
      'email',
      'createdAt',
    ]);
  });

  it('lets the name column absorb the free space, with a floor', () => {
    const { result } = setup();

    const name = result.current.find((c) => c.field === 'name');
    // The identifier column is the one the reader scans; it grows, the rest do not.
    expect(name?.flex).toBe(1);
    expect(name?.minWidth).toBe(200);
  });

  it.each([
    ['contactName', 'Jane Doe'],
    ['phone', '+49 911 000000'],
    ['email', 'jane@acme.de'],
  ])('reads the %s cell from the row', (field, expected) => {
    const { result } = setup();

    expect(columnByField(result.current, field).valueGetter?.(undefined, supplier())).toBe(expected);
  });

  it.each(['contactName', 'phone', 'email'])(
    'renders a placeholder when %s is absent',
    (field) => {
      const { result } = setup();
      const getter = columnByField(result.current, field).valueGetter;

      // The backend leaves these nullable; an empty cell would break the row rhythm.
      expect(getter?.(undefined, supplier({ [field]: null }))).toBe(EM_DASH);
      expect(getter?.(undefined, null)).toBe(EM_DASH);
    }
  );

  it('reads the raw createdAt timestamp, or null when the supplier has none', () => {
    const { result } = setup();
    const getter = columnByField(result.current, 'createdAt').valueGetter;

    expect(getter?.(undefined, supplier())).toBe('2026-05-01T00:00:00Z');
    expect(getter?.(undefined, supplier({ createdAt: null }))).toBeNull();
    expect(getter?.(undefined, null)).toBeNull();
  });

  it('formats createdAt through the date preference and degrades on unreadable input', () => {
    const { result } = setup();
    const format = columnByField(result.current, 'createdAt').valueFormatter;

    expect(format?.('2026-05-01T00:00:00Z')).toBe('2026-05-01');
    expect(format?.(null)).toBe(EM_DASH);
    expect(format?.('not-a-date')).toBe(EM_DASH);
  });

  it('follows the date-format preference rather than a hard-coded pattern', () => {
    mockUseSettings.mockReturnValue({
      userPreferences: { dateFormat: 'DD.MM.YYYY', tableDensity: 'comfortable' },
    });

    const { result } = setup();

    expect(columnByField(result.current, 'createdAt').valueFormatter?.('2026-05-01T00:00:00Z')).toBe(
      '01.05.2026'
    );
  });

  it('keeps the same column array across re-renders', () => {
    const { result, rerender } = setup();

    const first = result.current;
    rerender();

    // Stable column identity keeps DataGrid from recalculating its column cache.
    expect(result.current).toBe(first);
  });
});
