import type { FC, ReactNode } from 'react';

type DataGridProps = {
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
    <div data-testid="data-grid" data-rows={rows.length} data-cols={columns.length}>
      {children}
    </div>
  );
};

export { DataGrid };
export default DataGrid;
