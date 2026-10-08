/**
 * @file LanguageRegionSettingsSection.test.tsx
 * @module __tests__/app/settings/sections/LanguageRegionSettingsSection
 * @description
 * Tests for LanguageRegionSettingsSection.
 *
 * Scope:
 * - Renders the UI language choice (endonyms, FW5) and the date and number format options
 * - Number-format labels come from i18n (no hard-coded English)
 * - Shows preview examples (via formatter utilities)
 * - Delegates changes to the provided callbacks
 *
 * Out of scope:
 * - Applying these formats globally to the application
 * - Persisting the language (ShellPreferencesProvider spec)
 * - Real formatter correctness (covered by formatter unit tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageRegionSettingsSection from '@/app/settings/sections/LanguageRegionSettingsSection';
import { formatDate, formatNumber } from '@/utils/formatters';
import type { DateFormat, NumberFormat } from '@/context/settings/SettingsContext.types';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('@/utils/formatters', () => ({
  formatDate: vi.fn((_date: Date, format: string) => `${format}: 22.12.2025`),
  formatNumber: vi.fn((_num: number, format: string) => `${format}: 1.234,56`),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

describe('LanguageRegionSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSection(params?: {
    locale?: 'de' | 'en';
    onLocaleChange?: (v: 'de' | 'en') => void;
    dateFormat?: DateFormat;
    numberFormat?: NumberFormat;
    onDateChange?: (v: DateFormat) => void;
    onNumberChange?: (v: NumberFormat) => void;
  }) {
    const dateFormat = params?.dateFormat ?? ('DD.MM.YYYY' as DateFormat);
    const numberFormat = params?.numberFormat ?? ('DE' as NumberFormat);
    const onDateFormatChange = params?.onDateChange ?? vi.fn();
    const onNumberFormatChange = params?.onNumberChange ?? vi.fn();
    const locale = params?.locale ?? 'de';
    const onLocaleChange = params?.onLocaleChange ?? vi.fn();

    return {
      ...render(
        <LanguageRegionSettingsSection
          locale={locale}
          onLocaleChange={onLocaleChange}
          dateFormat={dateFormat}
          onDateFormatChange={onDateFormatChange}
          numberFormat={numberFormat}
          onNumberFormatChange={onNumberFormatChange}
        />,
      ),
      onDateFormatChange,
      onNumberFormatChange,
    };
  }

  it('renders radio inputs for date and number formats', () => {
    // Accessibility contract: user can choose among multiple format options.
    renderSection();

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the languages in their own names and reflects the locale prop', () => {
    renderSection({ locale: 'en' });

    expect(screen.getByRole('radio', { name: 'Deutsch' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'English' })).toBeChecked();
  });

  it('calls onLocaleChange when the user selects the other language', async () => {
    const user = userEvent.setup();
    const onLocaleChange = vi.fn();
    renderSection({ locale: 'de', onLocaleChange });

    await user.click(screen.getByRole('radio', { name: 'English' }));

    expect(onLocaleChange).toHaveBeenCalledWith('en');
  });

  it('labels the number formats from translations', () => {
    renderSection();

    expect(screen.getByText(tEn('settings.numberFormatDe'))).toBeInTheDocument();
    expect(screen.getByText(tEn('settings.numberFormatEnUs'))).toBeInTheDocument();
    expect(screen.queryByText('German (DE)')).not.toBeInTheDocument();
  });

  it('renders preview examples using formatter utilities', () => {
    // UI contract: previews are computed via the formatter helpers.
    renderSection({
      dateFormat: 'DD.MM.YYYY' as DateFormat,
      numberFormat: 'DE' as NumberFormat,
    });

    expect(formatDate).toHaveBeenCalled();
    expect(formatNumber).toHaveBeenCalled();

    const datePreviews = screen.getAllByText(/22\.12\.2025/i);
    expect(datePreviews.length).toBeGreaterThan(0);

    const numberPreviews = screen.getAllByText(/1\.234,56/i);
    expect(numberPreviews.length).toBeGreaterThan(0);
  });

  it('calls onDateFormatChange when a different date format is selected', async () => {
    const user = userEvent.setup();
    const onDateChange = vi.fn();

    renderSection({ dateFormat: 'DD.MM.YYYY' as DateFormat, onDateChange });

    // Click the option preview (mocked as "<FORMAT>: 22.12.2025").
    const mmPreview = screen.getByText(/MM\/DD\/YYYY: 22\.12\.2025/i);
    await user.click(mmPreview);

    expect(onDateChange).toHaveBeenCalledWith('MM/DD/YYYY' as DateFormat);
  });

  it('calls onNumberFormatChange when a different number format is selected', async () => {
    const user = userEvent.setup();
    const onNumberChange = vi.fn();

    renderSection({ numberFormat: 'DE' as NumberFormat, onNumberChange });

    const enPreview = screen.getByText(/EN_US: 1\.234,56/i);
    await user.click(enPreview);

    expect(onNumberChange).toHaveBeenCalledWith('EN_US' as NumberFormat);
  });

  it('updates date preview when dateFormat prop changes', () => {
    const { rerender } = renderSection({ dateFormat: 'DD.MM.YYYY' as DateFormat });

    expect(screen.getByText(/DD\.MM\.YYYY: 22\.12\.2025/i)).toBeInTheDocument();

    rerender(
      <LanguageRegionSettingsSection
        locale="de"
        onLocaleChange={vi.fn()}
        dateFormat={'MM/DD/YYYY' as DateFormat}
        onDateFormatChange={vi.fn()}
        numberFormat={'DE' as NumberFormat}
        onNumberFormatChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/MM\/DD\/YYYY: 22\.12\.2025/i)).toBeInTheDocument();
  });

  it('updates number preview when numberFormat prop changes', () => {
    const { rerender } = renderSection({ numberFormat: 'DE' as NumberFormat });

    expect(screen.getByText(/DE: 1\.234,56/i)).toBeInTheDocument();

    rerender(
      <LanguageRegionSettingsSection
        locale="de"
        onLocaleChange={vi.fn()}
        dateFormat={'DD.MM.YYYY' as DateFormat}
        onDateFormatChange={vi.fn()}
        numberFormat={'EN_US' as NumberFormat}
        onNumberFormatChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/EN_US: 1\.234,56/i)).toBeInTheDocument();
  });
});
