/**
 * @file PriceChart.test.tsx
 * @module __tests__/components/pages/analytics/blocks/price-trend/PriceChart
 * @description
 * Enterprise tests for PriceChart:
 * - Loading skeleton
 * - Empty fallback
 * - Chart rendering with sorted data + formatted axes/tooltips
 *
 * Strategy:
 * - Recharts components are mocked to capture props (data, axis formatters, tooltip formatter)
 *   without relying on SVG/DOM complexity.
 * - Date/number formatters are mocked for deterministic output.
 */

import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { PricePoint } from '@/api/analytics';
import { PriceChart } from '@/pages/analytics/blocks/price-trend/PriceChart';
import type { PriceChartProps } from '@/pages/analytics/blocks/price-trend/PriceChart';

// -----------------------------------------------------------------------------
// Hoisted mocks
// -----------------------------------------------------------------------------

const mockFormatDate = vi.hoisted(() =>
  vi.fn((value: string, format: string) => `formatted-${value}-${format}`),
);

const mockFormatNumber = vi.hoisted(() =>
  vi.fn((value: number, format: string, decimals: number) => `num-${value.toFixed(decimals)}-${format}`),
);

// Captured props/data from the recharts mock.
let lastChartData: PricePoint[] = [];
let lastXAxisProps: Record<string, unknown> | null = null;
let lastYAxisProps: Record<string, unknown> | null = null;
let lastTooltipProps: Record<string, unknown> | null = null;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
  }),
}));

vi.mock('@/utils/formatters', () => ({
  formatDate: (value: string, format: string) => mockFormatDate(value, format),
  formatNumber: (value: number, format: string, decimals: number) =>
    mockFormatNumber(value, format, decimals),
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

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children?: ReactNode; data: PricePoint[] }) => {
    lastChartData = Array.isArray(data) ? data : [];
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

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function setup(overrides: Partial<PriceChartProps> = {}) {
  const props: PriceChartProps = {
    data: [],
    isLoading: false,
    dateFormat: 'MM/DD/YYYY' as PriceChartProps['dateFormat'],
    numberFormat: 'EN_US' as PriceChartProps['numberFormat'],
    ...overrides,
  };
  return render(<PriceChart {...props} />);
}

function resetRechartsCaptures() {
  lastChartData = [];
  lastXAxisProps = null;
  lastYAxisProps = null;
  lastTooltipProps = null;
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('PriceChart', () => {
  beforeEach(() => {
    resetRechartsCaptures();
    mockFormatDate.mockClear();
    mockFormatNumber.mockClear();
  });

  it('renders a skeleton while loading', () => {
    const { container } = setup({ isLoading: true });

    // MUI Skeleton may not have stable roles; class check is acceptable here.
    expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
  });

  it('shows an empty helper when no data is available', () => {
    setup({ data: [], isLoading: false });
    expect(screen.getByText('No price data available')).toBeInTheDocument();
  });

  it('renders chart with sorted data and formatted axis/tooltip functions', () => {
    const data: PricePoint[] = [
      { date: '2025-02-10', price: 12 },
      { date: '2025-02-08', price: 9 },
      { date: '2025-02-09', price: 11 },
    ];

    setup({
      data,
      isLoading: false,
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'EN_US',
    });

    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-length', '3');

    // Contract: chart data is sorted ascending by date for correct trend visualization.
    expect(lastChartData.map(p => p.date)).toEqual(['2025-02-08', '2025-02-09', '2025-02-10']);

    const tickFormatter = lastXAxisProps?.tickFormatter as ((value: string) => string) | undefined;
    const yTickFormatter = lastYAxisProps?.tickFormatter as ((value: number) => string) | undefined;
    const tooltipFormatter = lastTooltipProps?.formatter as ((value: number) => string) | undefined;

    expect(tickFormatter).toBeTypeOf('function');
    expect(yTickFormatter).toBeTypeOf('function');
    expect(tooltipFormatter).toBeTypeOf('function');

    expect(tickFormatter?.('2025-02-08')).toBe('formatted-2025-02-08-MM/DD/YYYY');
    expect(yTickFormatter?.(14)).toBe('num-14.00-EN_US');
    expect(tooltipFormatter?.(15)).toBe('num-15.00-EN_US');

    // Guard that our formatting utilities are actually used by the component.
    expect(mockFormatDate).toHaveBeenCalled();
    expect(mockFormatNumber).toHaveBeenCalled();
  });
});
