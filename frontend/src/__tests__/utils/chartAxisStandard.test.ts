/**
 * @file chartAxisStandard.test.ts
 * @module tests/utils/chartAxisStandard
 * @description Contract test: every visible Recharts XAxis and YAxis takes its tick props
 *   from chartAxisProps, so tick labels follow the theme's text token in both modes.
 *   Recharts' own #666 reads 2.33:1 on the dark card (S2-6). Sibling:
 *   chartAxis.test.ts (the chartAxisProps helper).
 */
import { describe, it, expect } from 'vitest';

const sources = import.meta.glob('/src/**/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('chart axis standard', () => {
  const axes = Object.entries(sources)
    .filter(([path, code]) => !path.includes('/__tests__/') && code.includes("from 'recharts'"))
    .flatMap(([path, code]) => (code.match(/<(?:XAxis|YAxis)\b[\s\S]*?\/>/g) ?? []).map((tag) => [path, tag] as const))
    // A hidden axis draws no tick labels.
    .filter(([, tag]) => !/\bhide\b/.test(tag));

  it('finds the axes it guards', () => {
    expect(axes.length).toBeGreaterThanOrEqual(21);
  });

  it('styles every visible axis through chartAxisProps', () => {
    const unstyled = axes.filter(([, tag]) => !/\{\.\.\.chartAxisProps\(/.test(tag)).map(([path]) => path);
    expect(unstyled).toEqual([]);
  });

  it('leaves the tick props to chartAxisProps', () => {
    const overriding = axes.filter(([, tag]) => /\btick\s*=/.test(tag)).map(([path]) => path);
    expect(overriding).toEqual([]);
  });
});
