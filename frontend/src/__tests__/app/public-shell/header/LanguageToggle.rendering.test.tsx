/**
 * @file LanguageToggle.rendering.test.tsx
 * @module __tests__/app/public-shell/header/LanguageToggle.rendering
 * @description
 * Rendering and accessibility tests for LanguageToggle.
 *
 * Scope:
 * - Renders the correct flag for the current locale
 * - Ensures baseline accessibility (button role + alt text)
 * - Verifies basic visual contracts (IconButton root class, image size)
 *
 * Out of scope:
 * - Tooltip behavior and user interactions (covered in LanguageToggle.interactions.test.tsx)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import LanguageToggle from '../../../../app/public-shell/header/LanguageToggle';

// Static asset stubs (Vite import paths)
vi.mock('/flags/de.svg', () => ({ default: 'de-flag.svg' }));
vi.mock('/flags/us.svg', () => ({ default: 'us-flag.svg' }));

type Props = React.ComponentProps<typeof LanguageToggle>;

describe('LanguageToggle (rendering)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToggle(props: Partial<Props> = {}) {
    const merged: Props = {
      locale: 'de',
      onToggle: vi.fn(),
      tooltip: 'Toggle language',
      ...props,
    };
    return render(<LanguageToggle {...merged} />);
  }

  it('renders as a button (accessible role)', () => {
    // Accessibility contract: control must be reachable via role="button".
    renderToggle();

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders the German flag when locale=de', () => {
    // Visual contract: active locale is reflected by the flag icon.
    renderToggle({ locale: 'de' });

    expect(screen.getByAltText('Deutsch')).toBeInTheDocument();
  });

  it('renders the English flag when locale=en', () => {
    // Visual contract: active locale is reflected by the flag icon.
    renderToggle({ locale: 'en' });

    expect(screen.getByAltText('English')).toBeInTheDocument();
  });

  it('updates the flag when locale prop changes', () => {
    // Guards against stale props in memoized components.
    const { rerender } = renderToggle({ locale: 'de' });
    expect(screen.getByAltText('Deutsch')).toBeInTheDocument();

    rerender(
      <LanguageToggle locale="en" onToggle={vi.fn()} tooltip="Toggle language" />,
    );

    expect(screen.getByAltText('English')).toBeInTheDocument();
  });

  it('renders the flag image at 20x20 pixels', () => {
    // Regression check: design spec expects a small, consistent icon size.
    renderToggle({ locale: 'de' });

    const img = screen.getByAltText('Deutsch') as HTMLImageElement;
    expect(img.width).toBe(20);
    expect(img.height).toBe(20);
  });

  it('renders using the MUI IconButton root styling', () => {
    // Layout contract: component uses IconButton for consistent header styling.
    const { container } = renderToggle();

    expect(container.querySelector('.MuiIconButton-root')).toBeInTheDocument();
  });
});
