/**
 * @file AppMain.test.tsx
 * @module __tests__/app/layout/AppMain
 * @description
 * Tests for the AppMain layout container.
 *
 * Scope:
 * - Renders the main content area.
 * - Conditionally renders a demo-mode informational banner.
 *
 * Out of scope:
 * - Route configuration and page logic.
 * - Authentication/authorization flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppMain from '../../../app/layout/AppMain';

/**
 * i18n mock:
 * AppMain provides a default translation value. Returning that default value keeps
 * tests stable regardless of translation JSON changes.
 */
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

/**
 * Test render helper:
 * Wraps AppMain in a router because the component renders an Outlet / routing content.
 */
function renderAppMain(isDemo: boolean) {
  return render(
    <MemoryRouter>
      <AppMain isDemo={isDemo} />
    </MemoryRouter>,
  );
}

describe('AppMain', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      // Keep signature aligned with typical i18n usage: (key, defaultValue) => string
      t: (_key: string, defaultValue: string) => defaultValue,
    });
  });

  describe('Demo mode banner', () => {
    it('renders an informational demo banner when isDemo=true', () => {
      // Business rule: demo users must see a non-blocking information banner.
      renderAppMain(true);

      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });

    it('does not render the demo banner when isDemo=false', () => {
      // Ensures demo messaging is not shown for regular users.
      renderAppMain(false);

      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
    });

    it('renders the demo banner using the MUI "info" alert variant', () => {
      // Verifies the banner is styled as an informational alert (not warning/error).
      const { container } = renderAppMain(true);

      // Note: this assertion is intentionally tied to MUI's class naming.
      // If you later replace MUI Alert or change its variant, update this test accordingly.
      const infoAlert = container.querySelector('.MuiAlert-standardInfo');
      expect(infoAlert).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    it('renders a semantic <main> region as the primary content container', () => {
      // Ensures the page has a clear, accessible main region.
      const { container } = renderAppMain(false);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('uses a flex container for the main layout', () => {
      // Verifies base layout expectations for consistent page composition.
      const { container } = renderAppMain(false);

      const main = container.querySelector('main');
      expect(main).toHaveStyle({ display: 'flex' });
    });

    it('enables vertical scrolling for overflowing content', () => {
      // Ensures the main container supports long pages without breaking layout.
      const { container } = renderAppMain(false);

      const main = container.querySelector('main');
      expect(main).toHaveStyle({ overflowY: 'auto' });
    });
  });

  describe('Prop behavior', () => {
    it('toggles demo banner visibility when isDemo changes', () => {
      // Validates rerender behavior and guards against stale state / memoization bugs.
      const { rerender } = renderAppMain(false);
      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <AppMain isDemo={true} />
        </MemoryRouter>,
      );

      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('renders the demo message using the default translation value', () => {
      // Ensures AppMain is wired to i18n and renders the expected default string.
      renderAppMain(true);

      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });
});
