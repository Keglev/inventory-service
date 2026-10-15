/**
 * @file chartLegendStandard.test.ts
 * @module tests/utils/chartLegendStandard
 * @description Contract test: every Recharts Legend declares its item order, and so does
 *   the tooltip of every line or bar chart with a legend. Recharts 3
 *   sorts legend items alphabetically by label by default, so an undeclared order
 *   follows the language ("Abgang, Zugang" in German, "Stock in, Stock out" in
 *   English). Sibling: chartLegend.test.ts (the legendOrder helper).
 */
import { describe, it, expect } from 'vitest';

const sources = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('chart legend standard', () => {
  const legends = Object.entries(sources)
    .filter(([path, code]) => !path.includes('/__tests__/') && code.includes("from 'recharts'"))
    .flatMap(([path, code]) => (code.match(/<Legend\b[\s\S]*?\/>/g) ?? []).map((tag) => [path, tag] as const));

  it('finds the legends it guards', () => {
    expect(legends.length).toBeGreaterThanOrEqual(6);
  });

  it('declares an itemSorter on every Recharts legend', () => {
    const unordered = legends.filter(([, tag]) => !/\bitemSorter=/.test(tag)).map(([path]) => path);
    expect(unordered).toEqual([]);
  });

  it('styles every Recharts legend through chartLegendProps', () => {
    const unstyled = legends.filter(([, tag]) => !/\{\.\.\.chartLegendProps\(/.test(tag)).map(([path]) => path);
    expect(unstyled).toEqual([]);
  });

  it('leaves the label text to chartLegendProps', () => {
    const overriding = legends.filter(([, tag]) => /\blabelStyle\s*=/.test(tag)).map(([path]) => path);
    expect(overriding).toEqual([]);
  });

  it('declares an itemSorter on the tooltip of every line or bar chart with a legend', () => {
    // Recharts sorts tooltip items by name by default; the tooltip must list series in legend order.
    const charts = Object.entries(sources).filter(
      ([path, code]) =>
        !path.includes('/__tests__/') && code.includes("from 'recharts'") && /<Legend\b/.test(code) && /<(LineChart|BarChart)\b/.test(code),
    );
    expect(charts.length).toBeGreaterThanOrEqual(5);
    const unordered = charts
      .filter(([, code]) => (code.match(/<Tooltip\b[\s\S]*?\/>/g) ?? []).some((tag) => !/\bitemSorter=/.test(tag)))
      .map(([path]) => path);
    expect(unordered).toEqual([]);
  });
});
