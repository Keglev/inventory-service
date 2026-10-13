/**
 * @file EmployeesActivityChart.test.tsx
 * @module __tests__/pages/analytics/sections/EmployeesActivityChart
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
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  LineChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: ({ name, type, stroke }: { name?: string; type?: string; stroke?: string }) => (
    <div data-testid="line" data-type={type} data-stroke={stroke}>
      {name}
    </div>
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: ({ tickFormatter }: { tickFormatter?: (v: string) => string }) => {
    lastXTickFormatter = tickFormatter ?? null;
    return <div data-testid="x-axis" />;
  },
  YAxis: ({ tickFormatter }: { tickFormatter?: (v: string | number) => string }) => {
    lastYTickFormatter = tickFormatter ?? null;
    return <div data-testid="y-axis" />;
  },
  Tooltip: ({
    formatter,
    labelFormatter,
  }: {
    formatter?: (v: number | string) => string;
    labelFormatter?: (v: string) => string;
  }) => {
    lastTooltipFormatter = formatter ?? null;
    lastTooltipLabelFormatter = labelFormatter ?? null;
    return <div data-testid="tooltip" />;
  },
  Legend: () => <div data-testid="legend" />,
}));

let lastYTickFormatter: ((v: string | number) => string) | null = null;
let lastTooltipFormatter: ((v: number | string) => string) | null = null;
let lastXTickFormatter: ((v: string) => string) | null = null;
let lastTooltipLabelFormatter: ((v: string) => string) | null = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/hooks/useSettings', () => ({
  useSettings: () => ({
    userPreferences: { numberFormat: 'DE', dateFormat: 'DD.MM.YYYY' },
  }),
}));

const { EmployeesActivityChart } = await import('@/pages/analytics/sections/EmployeesActivityChart');

const EMPLOYEES = [
  { createdBy: 'anna@acme.example', displayName: 'Anna' },
  { createdBy: 'ben@acme.example', displayName: 'Ben' },
];
const CHART_DATA = [
  { period: '2026-01', 'anna@acme.example': 3, 'ben@acme.example': 1 },
  { period: '2026-02', 'anna@acme.example': 2, 'ben@acme.example': 4 },
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

  it('formats axis counts and tooltip changes with a singular for one, passing strings through', () => {
    renderChart();

    expect(lastYTickFormatter?.(1234)).toBe('1.234');
    expect(lastYTickFormatter?.('raw')).toBe('raw');
    expect(lastTooltipFormatter?.(1234)).toBe('1.234 changes');
    expect(lastTooltipFormatter?.(1)).toBe('1 change');
    expect(lastTooltipFormatter?.('raw')).toBe('raw');
  });

  it('keeps each employee in one colour when the set of employees changes', () => {
    renderChart();
    const both = Object.fromEntries(
      screen.getAllByTestId('line').map((l) => [l.textContent, l.getAttribute('data-stroke')]),
    );
    cleanup();

    renderChart({ employees: [EMPLOYEES[1]] });

    expect(screen.getByTestId('line')).toHaveAttribute('data-stroke', both.Ben);
    expect(both.Anna).not.toBe(both.Ben);
  });

  it('draws straight segments between the periods', () => {
    renderChart();
    expect(screen.getAllByTestId('line').map((l) => l.getAttribute('data-type'))).toEqual(['linear', 'linear']);
  });

  it('labels monthly buckets by month and names the covered dates of a partial month', () => {
    renderChart({ granularity: 'monthly', from: '2026-01-15', to: '2026-02-28' });
    expect(lastXTickFormatter?.('2026-01')).toBe('Jan 2026');
    expect(lastTooltipLabelFormatter?.('2026-01')).toBe('January 2026 (15.01.2026 – 31.01.2026)');
    expect(lastTooltipLabelFormatter?.('2026-02')).toBe('February 2026');
  });

  it('labels daily buckets with the date in the user format', () => {
    renderChart({ granularity: 'daily' });
    expect(lastXTickFormatter?.('2026-06-13')).toBe('13.06.2026');
    expect(lastTooltipLabelFormatter?.('2026-06-13')).toBe('13.06.2026');
  });

  it('labels weekly buckets by their Monday and names the week in the tooltip', () => {
    renderChart({ granularity: 'weekly' });
    expect(lastXTickFormatter?.('2026-W37')).toBe('07.09.2026');
    expect(lastTooltipLabelFormatter?.('2026-W37')).toBe('Week of 07.09.2026');
  });
});
