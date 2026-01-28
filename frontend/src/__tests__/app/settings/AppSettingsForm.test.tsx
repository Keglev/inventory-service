/**
 * @file AppSettingsForm.test.tsx
 * @module __tests__/app/settings/AppSettingsForm
 * @description
 * Tests for AppSettingsForm orchestration:
 * - Composition: all settings sections render
 * - Wiring: props are forwarded to the correct sections
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppSettingsForm from '../../../app/settings/AppSettingsForm';

// --- Captured props to validate orchestration ---
let appearanceProps: unknown;
let languageProps: unknown;
let systemProps: unknown;
let notificationsProps: unknown;

vi.mock('../../../app/settings/sections', () => ({
  AppearanceSettingsSection: (props: unknown) => {
    appearanceProps = props;
    return <div data-testid="appearance-section">Appearance</div>;
  },
  LanguageRegionSettingsSection: (props: unknown) => {
    languageProps = props;
    return <div data-testid="language-section">Language</div>;
  },
  SystemPreferencesSection: (props: unknown) => {
    systemProps = props;
    return <div data-testid="system-section">System</div>;
  },
  NotificationsSettingsSection: (props: unknown) => {
    notificationsProps = props;
    return <div data-testid="notifications-section">Notifications</div>;
  },
}));

vi.mock('../../../utils/formatters', () => ({
  formatDate: vi.fn((date: unknown) => date),
  formatNumber: vi.fn((num: unknown) => num),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

type AppSettingsFormProps = React.ComponentProps<typeof AppSettingsForm>;

describe('AppSettingsForm', () => {
  const systemInfo: AppSettingsFormProps['systemInfo'] = {
    database: 'Oracle',
    environment: 'production',
    version: '1.0.0',
    status: 'healthy',
    buildDate: '2025-12-22',
  };

  const baseProps: AppSettingsFormProps = {
    dateFormat: 'DD.MM.YYYY',
    onDateFormatChange: vi.fn(),
    numberFormat: 'DE',
    onNumberFormatChange: vi.fn(),
    tableDensity: 'comfortable',
    onTableDensityChange: vi.fn(),
    systemInfo,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    appearanceProps = undefined;
    languageProps = undefined;
    systemProps = undefined;
    notificationsProps = undefined;
  });

  function renderForm(overrides: Partial<AppSettingsFormProps> = {}) {
    const props: AppSettingsFormProps = { ...baseProps, ...overrides };
    return render(<AppSettingsForm {...props} />);
  }

  it('renders all settings sections', () => {
    // Composition contract: form includes all settings sections.
    renderForm();

    expect(screen.getByTestId('appearance-section')).toBeInTheDocument();
    expect(screen.getByTestId('language-section')).toBeInTheDocument();
    expect(screen.getByTestId('system-section')).toBeInTheDocument();
    expect(screen.getByTestId('notifications-section')).toBeInTheDocument();
  });

  it('delegates the correct props to each section', () => {
    // Wiring contract: callbacks and values are forwarded to the correct child section.
    const onDateFormatChange: NonNullable<AppSettingsFormProps['onDateFormatChange']> = vi.fn();
    const onNumberFormatChange: NonNullable<AppSettingsFormProps['onNumberFormatChange']> = vi.fn();
    const onTableDensityChange: NonNullable<AppSettingsFormProps['onTableDensityChange']> = vi.fn();

    renderForm({
      dateFormat: 'MM/DD/YYYY',
      onDateFormatChange,
      numberFormat: 'EN_US',
      onNumberFormatChange,
      tableDensity: 'compact',
      onTableDensityChange,
    });

    expect(appearanceProps).toMatchObject({
      tableDensity: 'compact',
      onTableDensityChange,
    });

    expect(languageProps).toMatchObject({
      dateFormat: 'MM/DD/YYYY',
      onDateFormatChange,
      numberFormat: 'EN_US',
      onNumberFormatChange,
    });

    expect(systemProps).toMatchObject({
      systemInfo,
      isLoading: false,
    });

    // Currently no props expected, but we assert render + stable wiring point.
    expect(notificationsProps).toBeDefined();
  });

  it('forwards loading state to the system preferences section', () => {
    // UX contract: system section can render a loading state when data is unavailable.
    renderForm({ isLoading: true, systemInfo: null });

    expect(systemProps).toMatchObject({
      isLoading: true,
      systemInfo: null,
    });
  });
});
