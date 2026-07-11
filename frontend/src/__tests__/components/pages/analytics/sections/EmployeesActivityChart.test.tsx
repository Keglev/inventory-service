/**
 * @file EmployeesActivityChart.test.tsx
 * @module __tests__/components/pages/analytics/sections/EmployeesActivityChart
 * @description Contract tests for the employee activity chart card.
 *
 * Contract under test:
 * - The granularity toggle reports the chosen bucket and ignores the
 *   null MUI emits when the active button is re-clicked.
 * - Loading renders a skeleton; empty data renders the empty message.
 * - One Line series renders per employee with the display name (function
 *   dataKey accessor -- emails contain dots, locked lesson).
 *
 * Out of scope:
 * - The pivot, queries, and pagination (useEmployeesSectionData and
 *   EmployeesSection suites).
 * - Recharts rendering internals (mocked to markers).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { tEn } from '../../../../test/i18nEn';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name }: { name?: string }) => <div data-testid="line">{name}</div>,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'DE', dateFormat: 'DD.MM.YYYY' },
  }),
}));

const { EmployeesActivityChart } = await import('@/pages/analytics/sections/EmployeesActivityChart');

const EMPLOYEES = [
  { createdBy: 'anna@acme.com', displayName: 'Anna' },
  { createdBy: 'ben@acme.com', displayName: 'Ben' },
];
const CHART_DATA = [
  { period: '2026-01', 'anna@acme.com': 3, 'ben@acme.com': 1 },
  { period: '2026-02', 'anna@acme.com': 2, 'ben@acme.com': 4 },
];

function renderChart(overrides: Partial<Parameters<typeof EmployeesActivityChart>[0]> = {}) {
  const onGranularityChange = vi.fn();
  render(
    <EmployeesActivityChart
      granularity="daily"
      onGranularityChange={onGranularityChange}
      chartData={CHART_DATA}
      employees={EMPLOYEES}
      loading={false}
      {...overrides}
    />,
  );
  return { onGranularityChange };
}

describe('EmployeesActivityChart', () => {
  it('reports a granularity change from the toggle', async () => {
    const { onGranularityChange } = renderChart();
    await userEvent.click(screen.getByText(tEn('analytics:employees.granularity.weekly')));
    expect(onGranularityChange).toHaveBeenCalledWith('weekly');
  });

  it('ignores re-clicking the active toggle (MUI emits null)', async () => {
    const { onGranularityChange } = renderChart();
    await userEvent.click(screen.getByText(tEn('analytics:employees.granularity.daily')));
    expect(onGranularityChange).not.toHaveBeenCalled();
  });

  it('renders a skeleton while loading', () => {
    renderChart({ loading: true });
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('renders the empty message when there is no data', () => {
    renderChart({ chartData: [] });
    expect(screen.getByText(tEn('analytics:employees.empty'))).toBeInTheDocument();
  });

  it('renders one series per employee with display names', () => {
    renderChart();
    const lines = screen.getAllByTestId('line');
    expect(lines).toHaveLength(2);
    expect(screen.getByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('Ben')).toBeInTheDocument();
  });
});
