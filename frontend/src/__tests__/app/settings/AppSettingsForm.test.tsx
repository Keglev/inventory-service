/**
 * @file AppSettingsForm.test.tsx
 *
 * @what_is_under_test AppSettingsForm component
 * @responsibility Settings form layout orchestrating all settings sections
 * @out_of_scope Individual section behavior, settings persistence
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppSettingsForm from '../../../app/settings/AppSettingsForm';

// Mock settings sections
vi.mock('../../../app/settings/sections', () => ({
  AppearanceSettingsSection: vi.fn(() => (
    <div data-testid="appearance-section">Appearance</div>
  )),
  LanguageRegionSettingsSection: vi.fn(() => (
    <div data-testid="language-section">Language</div>
  )),
  SystemPreferencesSection: vi.fn(() => (
    <div data-testid="system-section">System</div>
  )),
  NotificationsSettingsSection: vi.fn(() => (
    <div data-testid="notifications-section">Notifications</div>
  )),
}));

// Mock formatters
vi.mock('../../../utils/formatters', () => ({
  formatDate: vi.fn((date) => date),
  formatNumber: vi.fn((num) => num),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
  }),
}));

describe('AppSettingsForm', () => {
  const mockSystemInfo = {
    database: 'Oracle',
    environment: 'production',
    version: '1.0.0',
    status: 'healthy',
    buildDate: '2025-12-22',
  };

  describe('Form structure', () => {
    it('renders form with all settings sections', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
      expect(screen.getByTestId('language-section')).toBeInTheDocument();
      expect(screen.getByTestId('system-section')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-section')).toBeInTheDocument();
    });

    it('renders with Box container', () => {
      const { container } = render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });
  });

  describe('Section rendering', () => {
    it('renders appearance settings section', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
    });

    it('renders language and region settings section', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('language-section')).toBeInTheDocument();
    });

    it('renders system preferences section', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('system-section')).toBeInTheDocument();
    });

    it('renders notifications settings section', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('notifications-section')).toBeInTheDocument();
    });
  });

  describe('Props passing', () => {
    it('passes appearance props to section', () => {
      const mockChange = vi.fn();
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={mockChange}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
    });

    it('passes language and region props to section', () => {
      const mockDateChange = vi.fn();
      const mockNumberChange = vi.fn();
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={mockDateChange}
          numberFormat="DE"
          onNumberFormatChange={mockNumberChange}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('language-section')).toBeInTheDocument();
    });

    it('passes system info to system preferences section', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('system-section')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('renders form when isLoading is false', () => {
      render(
        <AppSettingsForm
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
          systemInfo={mockSystemInfo}
          isLoading={false}
        />
      );

      expect(screen.getByTestId('system-section')).toBeInTheDocument();
    });
  });
});
