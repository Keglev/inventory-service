/**
 * @file chartTooltip.test.ts
 * @module tests/utils/chartTooltip
 * @description Unit test for chartTooltipProps: maps MUI theme tokens onto Recharts tooltip styles.
 */
import { describe, it, expect } from 'vitest';
import { chartTooltipProps } from '@/utils/chartTooltip';

describe('utils/chartTooltip.chartTooltipProps', () => {
  it('binds the tooltip surface and label to theme tokens', () => {
    const theme = {
      palette: {
        background: { paper: '#111' },
        divider: '#333',
        text: { primary: '#eee' },
        action: { selected: 'rgba(255, 255, 255, 0.16)' },
      },
    } as unknown as Parameters<typeof chartTooltipProps>[0];

    const props = chartTooltipProps(theme);

    expect(props.contentStyle.backgroundColor).toBe('#111');
    expect(props.contentStyle.border).toContain('#333');
    expect(props.labelStyle.color).toBe('#eee');
  });

  // Series colours fall below 4.5:1 as text on the tooltip surface (LO-2).
  it('draws item names and values in the text token', () => {
    const theme = {
      palette: {
        background: { paper: '#111' },
        divider: '#333',
        text: { primary: '#eee' },
        action: { selected: 'rgba(255, 255, 255, 0.16)' },
      },
    } as unknown as Parameters<typeof chartTooltipProps>[0];

    expect(chartTooltipProps(theme).itemStyle).toEqual({ color: '#eee' });
  });

  it('tints the hover band behind a bar with the theme selection colour', () => {
    const theme = {
      palette: {
        background: { paper: '#111' },
        divider: '#333',
        text: { primary: '#eee' },
        action: { selected: 'rgba(255, 255, 255, 0.16)' },
      },
    } as unknown as Parameters<typeof chartTooltipProps>[0];

    expect(chartTooltipProps(theme).cursor).toEqual({ fill: 'rgba(255, 255, 255, 0.16)' });
  });
});
