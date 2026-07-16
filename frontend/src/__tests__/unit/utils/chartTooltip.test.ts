/**
 * @file chartTooltip.test.ts
 * @module tests/unit/utils/chartTooltip
 * @description Unit test for chartTooltipProps: maps MUI theme tokens onto Recharts tooltip styles.
 */
import { describe, it, expect } from 'vitest';
import { chartTooltipProps } from '../../../utils/chartTooltip';

describe('utils/chartTooltip.chartTooltipProps', () => {
  it('binds the tooltip surface and label to theme tokens', () => {
    const theme = {
      palette: {
        background: { paper: '#111' },
        divider: '#333',
        text: { primary: '#eee' },
      },
    } as unknown as Parameters<typeof chartTooltipProps>[0];

    const props = chartTooltipProps(theme);

    expect(props.contentStyle.backgroundColor).toBe('#111');
    expect(props.contentStyle.border).toContain('#333');
    expect(props.labelStyle.color).toBe('#eee');
  });
});
