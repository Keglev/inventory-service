/**
 * @file StockChangeTable.tsx
 * @module pages/analytics/sections/StockChangeTable
 *
 * @summary
 * Card with a server-paged table of stock changes: a title, a loading skeleton
 * or a no-data message, the rows, and the pagination bar.
 *
 * @enterprise
 * The movement drilldown and the employee change log repeated the same card,
 * table, signed change cell and pagination wiring (P-R4, jscpd: 53 lines).
 * Each caller now supplies its columns (built with stockChangeColumns, which
 * keeps the shared cells identical) and its paging state.
 */
import {
  Card, CardContent, Typography, Skeleton,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, TablePagination,
} from '@mui/material';
import { ChartPlaceholder } from '../components/ChartCard';
import type { StockChangeColumn } from './stockChangeColumns';

export type StockChangeTableProps<R> = {
  title: string;
  testId: string;
  loading: boolean;
  emptyText: string;
  rows: R[];
  rowKey: (row: R, index: number) => string;
  columns: StockChangeColumn<R>[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
  rowsPerPage: number;
  /** Called with the new size; the caller resets the page. */
  onRowsPerPageChange: (size: number) => void;
  rowsPerPageOptions: number[];
  labelRowsPerPage?: string;
  /** Show the pagination bar without rows too (the employee log does, the drilldown does not). */
  paginationWhenEmpty?: boolean;
};

export default function StockChangeTable<R>({
  title, testId, loading, emptyText, rows, rowKey, columns,
  total, page, onPageChange, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions, labelRowsPerPage,
  paginationWhenEmpty = false,
}: StockChangeTableProps<R>) {
  return (
    <Card data-testid={testId}>
      <CardContent>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          {title}
        </Typography>

        {loading ? (
          <Skeleton variant="rounded" height={180} />
        ) : rows.length === 0 ? (
          <ChartPlaceholder height={120}>{emptyText}</ChartPlaceholder>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.header} align={column.align}>{column.header}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={rowKey(row, idx)} hover>
                    {columns.map((column) => (
                      <TableCell key={column.header} align={column.align} sx={column.sx?.(row)}>
                        {column.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {(paginationWhenEmpty || rows.length > 0) && (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_e, next) => onPageChange(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange(parseInt(e.target.value, 10))}
            rowsPerPageOptions={rowsPerPageOptions}
            labelRowsPerPage={labelRowsPerPage}
          />
        )}
      </CardContent>
    </Card>
  );
}
