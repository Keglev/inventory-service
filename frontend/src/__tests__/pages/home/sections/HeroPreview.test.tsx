/**
 * @file HeroPreview.test.tsx
 * @module __tests__/pages/home/sections/HeroPreview
 * @testing Vitest + Testing Library, mocked i18n resolving the English landing JSON.
 * @description Tests for the landing hero's product screenshot.
 *
 * Contract under test:
 * - The variant follows the language (German unless English) and the colour mode.
 * - The image carries its intrinsic size, so the browser reserves the box before load.
 * - A skeleton covers the box until the image has loaded.
 * - A failed load shows the placeholder, and that result belongs to the failed source.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import HeroPreview from '@/pages/home/sections/HeroPreview';
import { previewSrc } from '@/pages/home/sections/heroPreviewSrc';
import { tEn } from '@/__tests__/test/i18nEn';

const i18nState = vi.hoisted(() => ({ language: 'de' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
    i18n: i18nState,
  }),
}));

const ALT = 'SmartSupplyPro analytics: stock value over time and monthly stock movement';

const renderIn = (mode: 'light' | 'dark') => {
  const tree = () => (
    <ThemeProvider theme={createTheme({ palette: { mode } })}>
      <HeroPreview />
    </ThemeProvider>
  );
  const view = render(tree());
  return { ...view, again: () => view.rerender(tree()) };
};

describe('HeroPreview', () => {
  beforeEach(() => {
    i18nState.language = 'de';
  });

  it('picks the English variant only for English and German otherwise', () => {
    expect(previewSrc('en', 'light')).toBe('/images/hero-en-light.webp');
    expect(previewSrc('en-US', 'dark')).toBe('/images/hero-en-dark.webp');
    expect(previewSrc('de-DE', 'dark')).toBe('/images/hero-de-dark.webp');
    expect(previewSrc('fr', 'light')).toBe('/images/hero-de-light.webp');
    expect(previewSrc(undefined, 'light')).toBe('/images/hero-de-light.webp');
  });

  it('requests the variant for the current language and mode at its intrinsic size', () => {
    i18nState.language = 'en';
    renderIn('dark');

    const image = screen.getByAltText(ALT);
    expect(image).toHaveAttribute('src', '/images/hero-en-dark.webp');
    expect(image).toHaveAttribute('width', '1116');
    expect(image).toHaveAttribute('height', '641');
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('covers the box with a skeleton until the image has loaded', () => {
    renderIn('light');
    expect(screen.getByTestId('hero-preview-skeleton')).toBeInTheDocument();

    fireEvent.load(screen.getByAltText(ALT));

    expect(screen.queryByTestId('hero-preview-skeleton')).not.toBeInTheDocument();
  });

  it('shows the placeholder for a failed source and tries again when the variant changes', () => {
    const view = renderIn('light');
    fireEvent.error(screen.getByAltText(ALT));
    expect(screen.getByText('Analytics preview')).toBeInTheDocument();

    i18nState.language = 'en';
    view.again();

    expect(screen.getByAltText(ALT)).toHaveAttribute('src', '/images/hero-en-light.webp');
    expect(screen.getByTestId('hero-preview-skeleton')).toBeInTheDocument();
  });
});
