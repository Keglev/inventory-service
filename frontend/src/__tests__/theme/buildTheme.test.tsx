/**
 * @file buildTheme.test.tsx
 * @module tests/theme/buildTheme
 * @testing Vitest + React Testing Library (jsdom)
 * @description Unit tests for buildTheme's surface grades: the dark page, panel and card
 *   grades with their hover strength, the card grade winning over the Paper background in
 *   the rendered styles, and the light theme's card outline (cards and panels share one colour).
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, Drawer, Paper, ThemeProvider } from '@mui/material';
import { buildTheme } from '@/theme';

const renderSurfaces = (mode: 'light' | 'dark') =>
  render(
    <ThemeProvider theme={buildTheme('de', mode)}>
      <Paper data-testid="panel">panel</Paper>
      <Paper data-testid="outlined" variant="outlined">outlined</Paper>
      <Card data-testid="card" elevation={1}>card</Card>
    </ThemeProvider>,
  );

describe('buildTheme', () => {
  it('uses the blue-grey page and panel grades with a matching hover when mode is dark', () => {
    const { palette } = buildTheme('de', 'dark');

    expect(palette.background.default).toBe('#0B0F14');
    expect(palette.background.paper).toBe('#18202A');
    expect(palette.divider).toBe('rgba(148,178,214,0.22)');
    expect(palette.action.hover).toBe('rgba(148,178,214,0.14)');
    expect(palette.action.hoverOpacity).toBe(0.14);
  });

  it('paints cards and outlined papers in the card grade without an overlay when mode is dark', () => {
    renderSurfaces('dark');

    const card = getComputedStyle(screen.getByTestId('card'));
    expect(card.backgroundColor).toBe('rgb(36, 48, 64)');
    expect(card.backgroundImage).toBe('none');
    expect(getComputedStyle(screen.getByTestId('outlined')).backgroundColor).toBe('rgb(36, 48, 64)');
    expect(getComputedStyle(screen.getByTestId('panel')).backgroundColor).not.toBe('rgb(36, 48, 64)');
    expect(card.borderStyle).not.toBe('solid');
  });

  it('outlines cards and outlined papers but not panels when mode is light', () => {
    renderSurfaces('light');

    const card = getComputedStyle(screen.getByTestId('card'));
    expect(card.border).toBe('1px solid rgba(0, 0, 0, 0.12)');
    expect(getComputedStyle(screen.getByTestId('outlined')).borderColor).toBe('rgba(0, 0, 0, 0.12)');
    expect(getComputedStyle(screen.getByTestId('panel')).borderStyle).not.toBe('solid');
  });

  it('keeps the light surfaces and cards on background.paper when mode is light', () => {
    const { palette } = buildTheme('de', 'light');
    renderSurfaces('light');

    expect(palette.background.default).toBe('#F0F2F5');
    expect(palette.background.paper).toBe('#FFFFFF');
    expect(getComputedStyle(screen.getByTestId('card')).backgroundColor).not.toBe('rgb(36, 48, 64)');
    expect(getComputedStyle(screen.getByTestId('outlined')).backgroundColor).not.toBe('rgb(36, 48, 64)');
  });

  it('draws the drawer paper square and flat, so the rail meets the page panel', () => {
    render(
      <ThemeProvider theme={buildTheme('de', 'light')}>
        <Drawer variant="permanent" open PaperProps={{ 'data-testid': 'rail' } as object}>
          rail
        </Drawer>
      </ThemeProvider>,
    );
    expect(screen.getByTestId('rail')).toHaveStyle({ borderRadius: '0', boxShadow: 'none' });
  });

});
