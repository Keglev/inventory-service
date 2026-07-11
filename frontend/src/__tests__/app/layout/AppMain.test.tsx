/**
 * @file AppMain.test.tsx
 * @module tests/app/layout/AppMain
 * @what_is_under_test AppMain
 * @responsibility
 * Guarantees the main content area contract: semantic main region, flex
 * layout, internal vertical scrolling, and absence of the removed demo
 * banner (lives in the header badge).
 * @out_of_scope
 * Routed page content (Outlet targets); header badge behavior
 * (HeaderDemoBadge suite).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppMain from '../../../app/layout/AppMain';

/**
 * Test render helper:
 * Wraps AppMain in a router because the component renders an Outlet.
 */
function renderAppMain() {
  return render(
    <MemoryRouter>
      <AppMain />
    </MemoryRouter>,
  );
}

describe('AppMain', () => {
  describe('Layout structure', () => {
    it('renders a semantic <main> region as the primary content container', () => {
      const { container } = renderAppMain();

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    it('uses a flex container for the main layout', () => {
      const { container } = renderAppMain();

      const main = container.querySelector('main');
      expect(main).toHaveStyle({ display: 'flex' });
    });

    it('enables vertical scrolling for overflowing content', () => {
      const { container } = renderAppMain();

      const main = container.querySelector('main');
      expect(main).toHaveStyle({ overflowY: 'auto' });
    });
  });

  describe('Removed behavior', () => {
    it('renders no demo banner (indicator lives in the header badge)', () => {
      renderAppMain();

      expect(screen.queryByText(/demo mode/i)).not.toBeInTheDocument();
    });
  });
});
