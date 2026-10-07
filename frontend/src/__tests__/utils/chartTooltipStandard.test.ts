/**
 * @file chartTooltipStandard.test.ts
 * @module tests/utils/chartTooltipStandard
 * @description Contract test: every component that renders a Recharts tooltip takes its
 *   surface from chartTooltipProps, so tooltips follow the theme in light and dark mode.
 *   Recharts' default tooltip is a white box whose label is drawn in the theme's text
 *   colour, which is invisible in dark mode.
 */
import { describe, it, expect } from 'vitest';

const sources = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('chart tooltip standard', () => {
  const charts = Object.entries(sources).filter(
    ([path, code]) => !path.includes('/__tests__/') && code.includes("from 'recharts'") && /<Tooltip\b/.test(code),
  );

  it('finds the chart components it guards', () => {
    expect(charts.length).toBeGreaterThanOrEqual(12);
  });

  it('styles every Recharts tooltip through chartTooltipProps', () => {
    const unstyled = charts.filter(([, code]) => !code.includes('chartTooltipProps(')).map(([path]) => path);
    expect(unstyled).toEqual([]);
  });
});
