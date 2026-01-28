/**
 * @file LanguageRegionSettingsSection.test.tsx
 * @module __tests__/app/settings/sections/LanguageRegionSettingsSection
 * @description
 * Tests for LanguageRegionSettingsSection.
 *
 * Scope:
 * - Renders selectable date and number format options
 * - Shows preview examples (via formatter utilities)
 * - Delegates changes to the provided callbacks
 *
 * Out of scope:
 * - Applying these formats globally to the application
 * - i18n locale switching / persistence
 * - Real formatter correctness (covered by formatter unit tests)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageRegionSettingsSection from '../../../../app/settings/sections/LanguageRegionSettingsSection';
import { formatDate, formatNumber } from '../../../../utils/formatters';
import type { DateFormat, NumberFormat } from '@/context/settings/SettingsContext.types';

vi.mock('../../../../utils/formatters', () => ({
  formatDate: vi.fn((_date: Date, format: string) => `${format}: 22.12.2025`),
  formatNumber: vi.fn((_num: number, format: string) => `${format}: 1.234,56`),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('LanguageRegionSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSection(params?: {
    dateFormat?: DateFormat;
    numberFormat?: NumberFormat;
    onDateChange?: (v: DateFormat) => void;
    onNumberChange?: (v: NumberFormat) => void;
  }) {
    const dateFormat = params?.dateFormat ?? ('DD.MM.YYYY' as DateFormat);
    const numberFormat = params?.numberFormat ?? ('DE' as NumberFormat);
    const onDateFormatChange = params?.onDateChange ?? vi.fn();
    const onNumberFormatChange = params?.onNumberChange ?? vi.fn();

    return {
      ...render(
        <LanguageRegionSettingsSection
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
        dateFormat={'DD.MM.YYYY' as DateFormat}
        onDateFormatChange={vi.fn()}
        numberFormat={'EN_US' as NumberFormat}
        onNumberFormatChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/EN_US: 1\.234,56/i)).toBeInTheDocument();
  });
});
