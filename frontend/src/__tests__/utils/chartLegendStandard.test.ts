/**
 * @file chartLegendStandard.test.ts
 * @module tests/utils/chartLegendStandard
 * @description Contract test: every Recharts Legend declares its item order. Recharts 3
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
});
