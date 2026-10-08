/**
 * @file AppSettingsForm.test.tsx
 * @module __tests__/app/settings/AppSettingsForm
 * @description
 * Tests for AppSettingsForm orchestration:
 * - Composition: Appearance and Language & Region cards render, in that order; no
 *   system info (it moved to the About dialog, FW5 fork 3)
 * - Wiring: props are forwarded to the correct sections (theme to Appearance, language to Language & Region)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AppSettingsForm from '@/app/settings/AppSettingsForm';
import { tEn } from '@/__tests__/test/i18nEn';

// --- Captured props to validate orchestration ---
let appearanceProps: unknown;
let languageProps: unknown;

vi.mock('@/app/settings/sections/AppearanceSettingsSection', () => ({
  default: (props: unknown) => {
    appearanceProps = props;
    return <div data-testid="appearance-section">Appearance</div>;
  },
}));

vi.mock('@/app/settings/sections/LanguageRegionSettingsSection', () => ({
  default: (props: unknown) => {
    languageProps = props;
    return <div data-testid="language-section">Language</div>;
  },
}));


vi.mock('@/utils/formatters', () => ({
  formatDate: vi.fn((date: unknown) => date),
  formatNumber: vi.fn((num: unknown) => num),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

type AppSettingsFormProps = React.ComponentProps<typeof AppSettingsForm>;

describe('AppSettingsForm', () => {

  const baseProps: AppSettingsFormProps = {
    dateFormat: 'DD.MM.YYYY',
    onDateFormatChange: vi.fn(),
    numberFormat: 'DE',
    onNumberFormatChange: vi.fn(),
    tableDensity: 'comfortable',
    onTableDensityChange: vi.fn(),
    themeMode: 'light',
    onThemeModeChange: vi.fn(),
    locale: 'de',
    onLocaleChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    appearanceProps = undefined;
    languageProps = undefined;
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
    expect(screen.queryByText('System Info')).not.toBeInTheDocument();
  });

  it('delegates the correct props to each section', () => {
    // Wiring contract: callbacks and values are forwarded to the correct child section.
    const onDateFormatChange: NonNullable<AppSettingsFormProps['onDateFormatChange']> = vi.fn();
    const onNumberFormatChange: NonNullable<AppSettingsFormProps['onNumberFormatChange']> = vi.fn();
    const onTableDensityChange: NonNullable<AppSettingsFormProps['onTableDensityChange']> = vi.fn();
    const onThemeModeChange: NonNullable<AppSettingsFormProps['onThemeModeChange']> = vi.fn();
    const onLocaleChange: NonNullable<AppSettingsFormProps['onLocaleChange']> = vi.fn();

    renderForm({
      dateFormat: 'MM/DD/YYYY',
      onDateFormatChange,
      numberFormat: 'EN_US',
      onNumberFormatChange,
      tableDensity: 'compact',
      onTableDensityChange,
      themeMode: 'dark',
      onThemeModeChange,
      locale: 'en',
      onLocaleChange,
    });

    expect(appearanceProps).toMatchObject({
      themeMode: 'dark',
      onThemeModeChange,
      tableDensity: 'compact',
      onTableDensityChange,
    });

    expect(languageProps).toMatchObject({
      locale: 'en',
      onLocaleChange,
      dateFormat: 'MM/DD/YYYY',
      onDateFormatChange,
      numberFormat: 'EN_US',
      onNumberFormatChange,
    });

  });

  it('renders the section titles Appearance and Language & Region in order', () => {
    const { container } = renderForm();
    const text = container.textContent ?? '';
    const positions = ['Appearance', 'Language & Region'].map((title) => text.indexOf(title));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

});
