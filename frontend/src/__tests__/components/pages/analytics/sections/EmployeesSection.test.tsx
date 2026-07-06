/**
 * @file EmployeesSection.test.tsx
 * @summary Orchestration test for the Employees section: granularity toggle
 * refetches the aggregation, the chart pivots per employee, and the change
 * log is server-paginated.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { lineProps } = vi.hoisted(() => ({ lineProps: [] as Array<Record<string, unknown>> }));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: (props: Record<string, unknown>) => {
    lineProps.push(props);
    return <div data-testid="line" />;
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: {
      numberFormat: 'DE',
      dateFormat: 'DD.MM.YYYY',
    },
  }),
}));

const mockGetEmployeeActivity = vi.fn();
const mockGetEmployeeChanges = vi.fn();
vi.mock('@/api/analytics/employees', () => ({
  getEmployeeActivity: (...args: unknown[]) => mockGetEmployeeActivity(...args),
  getEmployeeChanges: (...args: unknown[]) => mockGetEmployeeChanges(...args),
}));

const EmployeesSection = (await import('@/pages/analytics/sections/EmployeesSection')).default;

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <EmployeesSection from="2026-01-01" to="2026-06-30" />
    </QueryClientProvider>,
  );
}

describe('EmployeesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lineProps.length = 0;
    mockGetEmployeeActivity.mockResolvedValue([
      { period: '2026-02', createdBy: 'jonas.weber@example.com', displayName: 'Jonas Weber', changeCount: 4 },
      { period: '2026-03', createdBy: 'jonas.weber@example.com', displayName: 'Jonas Weber', changeCount: 6 },
    ]);
    mockGetEmployeeChanges.mockResolvedValue({
      rows: [
        {
          timestamp: '2026-02-03T09:00:00',
          itemName: 'Item A',
          supplierName: 'Supplier One',
          change: -3,
          reason: 'SOLD',
          createdBy: 'jonas.weber@example.com',
        },
      ],
      total: 41,
    });
  });

  it('defaults to monthly and renders chart + change log', async () => {
    setup();

    await waitFor(() => {
      expect(mockGetEmployeeActivity).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: 'monthly', from: '2026-01-01', to: '2026-06-30' }),
      );
    });
    expect(screen.getByTestId('employee-activity-card')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Item A')).toBeInTheDocument();
    });
    expect(screen.getByText('Supplier One')).toBeInTheDocument();
  });

  it('uses function dataKeys so email series keys are not read as dot-paths', async () => {
    setup();

    await waitFor(() => {
      expect(lineProps.length).toBeGreaterThan(0);
    });

    const dataKey = lineProps[0].dataKey;
    expect(typeof dataKey).toBe('function');
    // The accessor must read the flat email key directly (Recharts would split
    // a string key on dots and resolve undefined for every point).
    const accessor = dataKey as (row: Record<string, unknown>) => number;
    expect(accessor({ period: '2026-02', 'jonas.weber@example.com': 4 })).toBe(4);
    expect(accessor({ period: '2026-03' })).toBe(0);
  });

  it('refetches the aggregation when the granularity toggle changes', async () => {
    const user = userEvent.setup();
    setup();

    await waitFor(() => {
      expect(mockGetEmployeeActivity).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: 'analytics:employees.granularity.weekly' }));

    await waitFor(() => {
      expect(mockGetEmployeeActivity).toHaveBeenCalledWith(
        expect.objectContaining({ granularity: 'weekly' }),
      );
    });
  });

  it('requests the next page from the server on pagination', async () => {
    const user = userEvent.setup();
    setup();

    await waitFor(() => {
      expect(mockGetEmployeeChanges).toHaveBeenCalledWith(
        expect.objectContaining({ page: 0, size: 25 }),
      );
    });

    await user.click(screen.getByRole('button', { name: /next page/i }));

    await waitFor(() => {
      expect(mockGetEmployeeChanges).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, size: 25 }),
      );
    });
  });
});
