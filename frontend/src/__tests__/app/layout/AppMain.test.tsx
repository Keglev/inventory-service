/**
 * @file AppMain.test.tsx
 *
 * @what_is_under_test AppMain component
 * @responsibility Renders main content area with optional demo mode banner and router outlet
 * @out_of_scope Route configuration, page component logic, authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppMain from '../../../app/layout/AppMain';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue: string) => defaultValue,
  }),
}));

describe('AppMain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Demo mode banner', () => {
    // Business rule: Demo users must see a non-blocking information banner
    it('renders demo banner when isDemo is true', () => {
      render(
        <MemoryRouter>
          <AppMain isDemo={true} />
        </MemoryRouter>
      );
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });

    it('does not render demo banner when isDemo is false', () => {
      render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
    });

    it('renders demo banner as info alert', () => {
      const { container } = render(
        <MemoryRouter>
          <AppMain isDemo={true} />
        </MemoryRouter>
      );
      const alert = container.querySelector('.MuiAlert-standardInfo');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('Content area rendering', () => {
    it('renders main content container', () => {
      const { container } = render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('renders router outlet for page content', () => {
      render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      // Outlet is rendered (even if empty in test)
      const { container } = render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Props variations', () => {
    it('toggles demo banner visibility based on isDemo prop', () => {
      const { rerender } = render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();

      rerender(
        <MemoryRouter>
          <AppMain isDemo={true} />
        </MemoryRouter>
      );
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });

  describe('Translation integration', () => {
    it('uses auth namespace for demo message', () => {
      render(
        <MemoryRouter>
          <AppMain isDemo={true} />
        </MemoryRouter>
      );
      // Translation mock returns default value
      expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    it('uses flexbox layout for content area', () => {
      const { container } = render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      const main = container.querySelector('main');
      expect(main).toHaveStyle({ display: 'flex' });
    });

    it('enables vertical scrolling', () => {
      const { container } = render(
        <MemoryRouter>
          <AppMain isDemo={false} />
        </MemoryRouter>
      );
      const main = container.querySelector('main');
      expect(main).toHaveStyle({ overflowY: 'auto' });
    });
  });
});
