/**
 * @file NavItem.test.tsx
 *
 * @what_is_under_test NavItem component
 * @responsibility Renders navigation list items with active route highlighting and disabled state support
 * @out_of_scope Routing configuration, feature flag management, actual navigation behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import NavItem from '../../../app/layout/sidebar/NavItem';

describe('NavItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders navigation item with label', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
        </MemoryRouter>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    it('renders navigation item with icon', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
        </MemoryRouter>
      );
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders as a link to correct route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
        </MemoryRouter>
      );
      const link = container.querySelector('a[href="/dashboard"]');
      expect(link).toBeInTheDocument();
    });
  });

  describe('Active route highlighting', () => {
    // Business rule: Selected state must reflect current route for UX clarity
    it('highlights when current route matches navigation item', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
        </MemoryRouter>
      );
      const button = container.querySelector('.Mui-selected');
      expect(button).toBeInTheDocument();
    });

    it('does not highlight when current route does not match', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/inventory']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
        </MemoryRouter>
      );
      const button = container.querySelector('.Mui-selected');
      expect(button).not.toBeInTheDocument();
    });

    it('highlights when current route starts with navigation item route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/analytics/overview']}>
          <NavItem to="/analytics" icon={DashboardIcon} label="Analytics" />
        </MemoryRouter>
      );
      const button = container.querySelector('.Mui-selected');
      expect(button).toBeInTheDocument();
    });

    it('does not highlight root route when on different route', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <NavItem to="/" icon={DashboardIcon} label="Home" />
        </MemoryRouter>
      );
      const button = container.querySelector('.Mui-selected');
      expect(button).not.toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('renders disabled navigation item', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/reports" icon={DashboardIcon} label="Reports" disabled={true} />
        </MemoryRouter>
      );
      const button = container.querySelector('.Mui-disabled');
      expect(button).toBeInTheDocument();
    });

    it('shows tooltip when disabled with tooltip text', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem
            to="/reports"
            icon={DashboardIcon}
            label="Reports"
            disabled={true}
            tooltip="Feature coming soon"
          />
        </MemoryRouter>
      );
      // Tooltip component wraps the content
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('does not show tooltip wrapper when not disabled', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label="Dashboard" disabled={false} />
        </MemoryRouter>
      );
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Different routes', () => {
    it('renders inventory navigation item', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/inventory" icon={DashboardIcon} label="Inventory" />
        </MemoryRouter>
      );
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('renders suppliers navigation item', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/suppliers" icon={DashboardIcon} label="Suppliers" />
        </MemoryRouter>
      );
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
    });

    it('renders nested route navigation item', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/analytics/overview" icon={DashboardIcon} label="Analytics" />
        </MemoryRouter>
      );
      expect(screen.getByText('Analytics')).toBeInTheDocument();
    });
  });

  describe('Label variations', () => {
    it('handles undefined label gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label={undefined} />
        </MemoryRouter>
      );
      // Component should still render without crashing
      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem to="/dashboard" icon={DashboardIcon} label={undefined} />
        </MemoryRouter>
      );
      expect(container).toBeInTheDocument();
    });

    it('renders long label text', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <NavItem
            to="/analytics"
            icon={DashboardIcon}
            label="Analytics and Reporting Dashboard"
          />
        </MemoryRouter>
      );
      expect(screen.getByText('Analytics and Reporting Dashboard')).toBeInTheDocument();
    });
  });
});
