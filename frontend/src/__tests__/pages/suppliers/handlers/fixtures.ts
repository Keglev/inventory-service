/**
 * @file fixtures.ts
 * @module __tests__/pages/suppliers/handlers/fixtures
 * @description Shared fixture (fork 4 A, 2026-10-22): the suppliers board
 * state with neutral values and a fresh spy for every setter, as the four
 * handler specs each built it. Consumers: useDialogHandlers.test.ts,
 * useFilterHandlers.test.ts, useSearchHandlers.test.ts,
 * useToolbarHandlers.test.ts.
 */
import { vi } from 'vitest';

import type { UseSuppliersBoardStateReturn } from '@/pages/suppliers/hooks/useSuppliersBoardState';

export const createState = (overrides: Partial<UseSuppliersBoardStateReturn> = {}): UseSuppliersBoardStateReturn => ({
  paginationModel: { page: 0, pageSize: 10 },
  sortModel: [],
  searchQuery: '',
  selectedId: null,
  selectedSearchResult: null,
  openCreate: false,
  openEdit: false,
  openDelete: false,
  setOpenCreate: vi.fn(),
  setOpenEdit: vi.fn(),
  setOpenDelete: vi.fn(),
  setSearchQuery: vi.fn(),
  setSelectedSearchResult: vi.fn(),
  setSelectedId: vi.fn(),
  setPaginationModel: vi.fn(),
  setSortModel: vi.fn(),
  ...overrides,
});
