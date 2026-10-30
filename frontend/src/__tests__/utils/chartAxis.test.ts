/**
 * @file chartAxis.test.ts
 * @module tests/utils/chartAxis
 * @description Axis tick labels take the secondary text token; other tick attributes pass
 *   through, and the theme's fill wins over a caller's. Sibling: chartAxisStandard.test.ts
 *   (every chart axis uses the helper).
 */
import { describe, it, expect } from 'vitest';
import { chartAxisProps } from '@/utils/chartAxis';

const theme = { palette: { text: { secondary: '#bdc1c6' } } } as unknown as Parameters<typeof chartAxisProps>[0];

describe('chartAxisProps', () => {
  it('draws tick labels in the secondary text token', () => {
    expect(chartAxisProps(theme).tick).toEqual({ fill: '#bdc1c6' });
  });

  it('keeps other tick attributes when a font size is given', () => {
    expect(chartAxisProps(theme, { fontSize: 12 }).tick).toEqual({ fontSize: 12, fill: '#bdc1c6' });
  });

  it('keeps the theme fill when a caller passes another fill', () => {
    expect(chartAxisProps(theme, { fill: '#666' }).tick.fill).toBe('#bdc1c6');
  });
});
