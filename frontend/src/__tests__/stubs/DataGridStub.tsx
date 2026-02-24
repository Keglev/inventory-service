/**
 * @file DataGridStub.tsx
 * @description Minimal test stub for the MUI/X DataGrid component.
 *
 * Purpose:
 * - Replace the real DataGrid in unit tests to avoid jsdom/layout complexity.
 * - Provide stable, low-cost rendering with basic observability (row/column counts).
 *
 * Contract under test:
 * - Renders a single container element with `data-testid="data-grid"`.
 * - Exposes `data-rows` and `data-cols` attributes derived from `rows`/`columns`.
 * - Accepts common DataGrid props used by the app (even if the stub ignores them).
 *
 * Out of scope:
 * - Sorting/filtering/pagination behavior.
 * - Keyboard/mouse interactions.
 * - Styling and virtualization.
 */

import type { FC, ReactNode } from 'react';

type DataGridProps = {
  // Keep this prop surface broad enough for consumers to compile.
  // Stubs should not implement behavior; tests should assert on contract-level outputs.
  rows?: unknown[];
  columns?: unknown[];
  paginationModel?: unknown;
  onPaginationModelChange?: (model: unknown) => void;
  sortModel?: unknown;
  onSortModelChange?: (model: unknown) => void;
  rowCount?: number;
  loading?: boolean;
  onRowClick?: (params: unknown) => void;
  children?: ReactNode;
};

const DataGrid: FC<DataGridProps> = ({ rows = [], columns = [], children }) => {
  return (
    // Stable marker for tests. Avoid adding additional structure to keep queries predictable.
    <div data-testid="data-grid" data-rows={rows.length} data-cols={columns.length}>
      {children}
    </div>
  );
};

export { DataGrid };
export default DataGrid;
