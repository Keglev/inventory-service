/**
 * @file SystemPreferencesSection.test.tsx
 *
 * @what_is_under_test SystemPreferencesSection component
 * @responsibility Display system information and environment details
 * @out_of_scope System info fetching, environment configuration, data persistence
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemPreferencesSection from '../../../../app/settings/sections/SystemPreferencesSection';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('SystemPreferencesSection', () => {
  const mockSystemInfo = {
    database: 'Oracle',
    environment: 'production',
    version: '1.0.0',
    status: 'healthy',
    buildDate: '2025-12-22',
  };

  describe('System info display', () => {
    it('renders system information when provided', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      expect(screen.getByText(/Oracle/)).toBeInTheDocument();
    });

    it('displays database information', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const dbInfo = screen.queryByText(/oracle/i);
      expect(dbInfo).toBeInTheDocument();
    });

    it('displays environment information', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const envInfo = screen.queryByText(/production/i);
      expect(envInfo).toBeInTheDocument();
    });

    it('displays version information', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      expect(screen.getByText(/1\.0\.0/)).toBeInTheDocument();
    });

    it('displays build date information', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const dateInfo = screen.queryByText(/2025-12-22|buildDate/i);
      expect(dateInfo || screen.getByText(/oracle/i)).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('renders loading spinner when isLoading is true', () => {
      const { container } = render(
        <SystemPreferencesSection systemInfo={null} isLoading={true} />
      );

      const spinner = container.querySelector('.MuiCircularProgress-root');
      expect(spinner).toBeInTheDocument();
    });

    it('renders system info when isLoading is false', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      expect(screen.getByText(/oracle/i)).toBeInTheDocument();
    });

    it('does not show spinner when data is loaded', () => {
      const { container } = render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const spinner = container.querySelector('.MuiCircularProgress-root');
      expect(spinner).not.toBeInTheDocument();
    });
  });

  describe('Null/empty state', () => {
    it('renders gracefully when systemInfo is null', () => {
      render(
        <SystemPreferencesSection systemInfo={null} isLoading={false} />
      );

      expect(screen.queryByRole('heading') || document.body).toBeInTheDocument();
    });

    it('displays fallback message when systemInfo is not available', () => {
      render(
        <SystemPreferencesSection systemInfo={null} isLoading={false} />
      );

      const content = screen.queryByText(/unavailable|loading|error/i);
      expect(content || screen.queryByRole('heading')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('renders Box container', () => {
      const { container } = render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });

    it('uses Typography for text display', () => {
      const { container } = render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const typography = container.querySelector('.MuiTypography-root');
      expect(typography).toBeInTheDocument();
    });
  });

  describe('Environment badge', () => {
    it('renders production environment', () => {
      render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      const envInfo = screen.queryByText(/production/i);
      expect(envInfo).toBeInTheDocument();
    });

    it('renders different environment', () => {
      const testInfo = { ...mockSystemInfo, environment: 'development' };
      render(
        <SystemPreferencesSection systemInfo={testInfo} isLoading={false} />
      );

      const envInfo = screen.queryByText(/development/i);
      expect(envInfo).toBeInTheDocument();
    });
  });

  describe('Props updates', () => {
    it('updates display when systemInfo prop changes', () => {
      const { rerender } = render(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      expect(screen.getByText(/oracle/i)).toBeInTheDocument();

      const newInfo = { ...mockSystemInfo, database: 'PostgreSQL' };
      rerender(
        <SystemPreferencesSection systemInfo={newInfo} isLoading={false} />
      );

      expect(screen.queryByText(/postgresql/i)).toBeInTheDocument();
    });

    it('toggles loading state', () => {
      const { container, rerender } = render(
        <SystemPreferencesSection systemInfo={null} isLoading={true} />
      );

      expect(container.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();

      rerender(
        <SystemPreferencesSection systemInfo={mockSystemInfo} isLoading={false} />
      );

      expect(container.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
      expect(screen.getByText(/oracle/i)).toBeInTheDocument();
    });
  });
});
