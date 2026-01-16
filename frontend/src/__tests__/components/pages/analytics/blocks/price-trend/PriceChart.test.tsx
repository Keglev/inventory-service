/**
 * @file PriceChart.test.tsx
 * @module __tests__/pages/analytics/price-trend/PriceChart
 *
 * @summary
 * Tests PriceChart loading state, empty fallback, and formatted chart rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { PricePoint } from '@/api/analytics';

const mockFormatDate = vi.fn((value: string, format: string) => `formatted-${value}-${format}`);
const mockFormatNumber = vi.fn((value: number, format: string, decimals: number) => `num-${value.toFixed(decimals)}-${format}`);

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/utils/formatters', () => ({
  formatDate: (value: string, format: string) => mockFormatDate(value, format),
  formatNumber: (value: number, format: string, decimals: number) => mockFormatNumber(value, format, decimals),
}));

vi.mock('@mui/material/styles', async () => {
  const actual = await vi.importActual<typeof import('@mui/material/styles')>('@mui/material/styles');
  return {
    ...actual,
    useTheme: () => ({
      palette: {
        primary: { main: '#123456' },
      },
    }),
  };
});

let lastChartData: PricePoint[] = [];
let lastXAxisProps: Record<string, unknown> | null = null;
let lastYAxisProps: Record<string, unknown> | null = null;
let lastTooltipProps: Record<string, unknown> | null = null;

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: PricePoint[] }) => {
    lastChartData = data;
    return (
      <div data-testid="line-chart" data-length={Array.isArray(data) ? data.length : 0}>
        {children}
      </div>
    );
  },
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  XAxis: (props: Record<string, unknown>) => {
    lastXAxisProps = props;
    return <div data-testid="x-axis" />;
  },
  YAxis: (props: Record<string, unknown>) => {
    lastYAxisProps = props;
    return <div data-testid="y-axis" />;
  },
  Tooltip: (props: Record<string, unknown>) => {
    lastTooltipProps = props;
    return <div data-testid="tooltip" />;
  },
  Line: () => <div data-testid="line" />,
}));

const { PriceChart } = await import('@/pages/analytics/blocks/price-trend/PriceChart');

describe('PriceChart', () => {
  beforeEach(() => {
    lastChartData = [];
    lastXAxisProps = null;
    lastYAxisProps = null;
    lastTooltipProps = null;
    mockFormatDate.mockClear();
    mockFormatNumber.mockClear();
  });

  it('renders skeleton while loading', () => {
    render(<PriceChart data={[]} isLoading dateFormat="MM/DD/YYYY" numberFormat="EN_US" />);
    expect(document.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows empty helper when no data is available', () => {
    render(<PriceChart data={[]} isLoading={false} dateFormat="MM/DD/YYYY" numberFormat="EN_US" />);
    expect(screen.getByText('No price data available')).toBeInTheDocument();
  });

  it('renders chart with sorted data and formatted axes', () => {
    const data: PricePoint[] = [
      { date: '2025-02-10', price: 12 },
      { date: '2025-02-08', price: 9 },
      { date: '2025-02-09', price: 11 },
    ];

    render(<PriceChart data={data} isLoading={false} dateFormat="MM/DD/YYYY" numberFormat="EN_US" />);

    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-length', '3');
    expect(lastChartData.map((point) => point.date)).toEqual(['2025-02-08', '2025-02-09', '2025-02-10']);

    const tickFormatter = lastXAxisProps?.tickFormatter as ((value: string) => string) | undefined;
    const yFormatter = lastYAxisProps?.tickFormatter as ((value: number) => string) | undefined;
    const tooltipFormatter = lastTooltipProps?.formatter as ((value: number) => string) | undefined;

    expect(tickFormatter?.('2025-02-08')).toBe('formatted-2025-02-08-MM/DD/YYYY');
    expect(yFormatter?.(14)).toBe('num-14.00-EN_US');
    expect(tooltipFormatter?.(15)).toBe('num-15.00-EN_US');

    expect(mockFormatDate).toHaveBeenCalled();
    expect(mockFormatNumber).toHaveBeenCalled();
  });
});
