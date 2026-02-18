/**
 * @file fixtures.ts
 * @module __tests__/components/pages/inventory/fixtures
 * @description Shared typed fixtures for inventory page tests.
 *
 * Principles:
 * - Keep tests focused on handler contracts (setter calls + state resets).
 * - Provide a single, strictly-typed factory to reduce duplication.
 */

import { vi } from 'vitest';
import type {
  InventoryState,
  InventoryStateSetters,
} from '../../../../pages/inventory/hooks/useInventoryState';

type InventoryTestState = InventoryState & InventoryStateSetters;

export function makeInventoryState(overrides: Partial<InventoryTestState> = {}): InventoryTestState {
  return {
    q: '',
    supplierId: null,
    belowMinOnly: false,
    paginationModel: { page: 0, pageSize: 10 },
    sortModel: [],
    selectedId: null,
    openNew: false,
    openEditName: false,
    openDelete: false,
    openEdit: false,
    openAdjust: false,
    openPrice: false,

    setQ: vi.fn(),
    setSupplierId: vi.fn(),
    setBelowMinOnly: vi.fn(),
    setPaginationModel: vi.fn(),
    setSortModel: vi.fn(),
    setSelectedId: vi.fn(),
    setOpenNew: vi.fn(),
    setOpenEditName: vi.fn(),
    setOpenDelete: vi.fn(),
    setOpenEdit: vi.fn(),
    setOpenAdjust: vi.fn(),
    setOpenPrice: vi.fn(),

    ...overrides,
  };
}
