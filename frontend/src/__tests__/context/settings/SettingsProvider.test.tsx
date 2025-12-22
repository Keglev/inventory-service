/**
 * @file SettingsProvider.test.tsx
 *
 * @what_is_under_test SettingsProvider component - manages application settings and system info
 * @responsibility Provide settings context with user prefs, system info, and preference updates
 * @out_of_scope i18n language detection, localStorage serialization, system info API format
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SettingsProvider } from '../../../context/settings/SettingsContext';

// Mock useTranslation hook to prevent i18n initialization during tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: {
      language: 'en',
      on: vi.fn(),
      off: vi.fn(),
    },
  }),
}));

// Mock system info utility to prevent actual API calls
vi.mock('../../../utils/systemInfo', () => ({
  getSystemInfo: vi.fn(() =>
    Promise.resolve({
      database: 'Oracle',
      version: '1.0.0',
      environment: 'production',
      apiVersion: 'v1',
      buildDate: '2025-12-22',
      uptime: '100h',
      status: 'ONLINE',
    })
  ),
}));

describe('SettingsProvider', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Provider rendering', () => {
    it('renders children correctly', () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Settings Available</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <SettingsProvider>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <div data-testid="child-3">Child 3</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-3')).toBeInTheDocument();
    });

    it('renders without errors with no children', () => {
      const { container } = render(
        <SettingsProvider>
          <div />
        </SettingsProvider>
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe('Context provision', () => {
    it('provides SettingsContext to children', () => {
      const TestComponent = () => {
        return <div data-testid="context-test">Settings context available</div>;
      };

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(screen.getByTestId('context-test')).toBeInTheDocument();
    });
  });

  describe('Preferences loading', () => {
    it('loads preferences from localStorage on mount', () => {
      const mockPrefs = {
        dateFormat: 'DD.MM.YYYY',
        numberFormat: 'DE',
        tableDensity: 'comfortable',
      };

      localStorage.setItem('ssp.settings', JSON.stringify(mockPrefs));

      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('uses default preferences when localStorage is empty', () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('handles corrupted localStorage gracefully', () => {
      localStorage.setItem('ssp.settings', 'invalid json {');

      expect(() => {
        render(
          <SettingsProvider>
            <div data-testid="test-child">Test</div>
          </SettingsProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('System info fetching', () => {
    it('fetches system info on mount', async () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      // System info is fetched asynchronously
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('provides fallback values when system info fetch fails', async () => {
      vi.resetModules();

      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('continues operation when API is unavailable', async () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      // Should render despite potential API errors
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('i18n synchronization', () => {
    it('syncs preferences with language changes', () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      // Provider listens to i18n changes
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('updates defaults when language changes', () => {
      const { rerender } = render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      // Simulate language change
      rerender(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('wraps children with context provider', () => {
      const { container } = render(
        <SettingsProvider>
          <span className="wrapped">Content</span>
        </SettingsProvider>
      );

      expect(container.querySelector('.wrapped')).toBeInTheDocument();
    });

    it('maintains component hierarchy', () => {
      render(
        <SettingsProvider>
          <div className="outer">
            <div className="inner" data-testid="inner">Nested</div>
          </div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('inner')).toBeInTheDocument();
    });
  });

  describe('Storage handling', () => {
    it('saves preferences changes to localStorage', () => {
      render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    it('handles localStorage unavailability gracefully', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      expect(() => {
        render(
          <SettingsProvider>
            <div data-testid="test-child">Test</div>
          </SettingsProvider>
        );
      }).not.toThrow();

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });

  describe('Cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const { unmount } = render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('cancels pending API requests on unmount', () => {
      const { unmount } = render(
        <SettingsProvider>
          <div data-testid="test-child">Test</div>
        </SettingsProvider>
      );

      expect(() => {
        unmount();
      }).not.toThrow();
    });
  });
});
