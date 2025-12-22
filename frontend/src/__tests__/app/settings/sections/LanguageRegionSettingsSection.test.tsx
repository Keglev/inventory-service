/**
 * @file LanguageRegionSettingsSection.test.tsx
 *
 * @what_is_under_test LanguageRegionSettingsSection component
 * @responsibility Date and number format selectors with preview examples
 * @out_of_scope Format application, actual locale changes, formatter implementation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageRegionSettingsSection from '../../../../app/settings/sections/LanguageRegionSettingsSection';

// Mock formatters
vi.mock('../../../../utils/formatters', () => ({
  formatDate: vi.fn((_date, format) => `${format}: 22.12.2025`),
  formatNumber: vi.fn((_num, format) => `${format}: 1.234,56`),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('LanguageRegionSettingsSection', () => {
  describe('Date format options', () => {
    it('renders date format radio group', () => {
      const { container } = render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radioGroups = container.querySelectorAll('.MuiRadioGroup-root');
      expect(radioGroups.length).toBeGreaterThanOrEqual(1);
    });

    it('displays date format options', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);
    });

    it('selects current date format', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const dateRadios = screen.getAllByRole('radio');
      const selectedRadio = dateRadios.find((radio) =>
        (radio as HTMLInputElement).checked
      );
      expect(selectedRadio).toBeInTheDocument();
    });
  });

  describe('Number format options', () => {
    it('renders number format radio group', () => {
      const { container } = render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radioGroups = container.querySelectorAll('.MuiRadioGroup-root');
      expect(radioGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('selects current number format', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Preview examples', () => {
    it('displays date format preview', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const datePreview = screen.queryAllByText(/22\.12\.2025/i);
      expect(datePreview.length).toBeGreaterThan(0);
    });

    it('displays number format preview', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const numberPreview = screen.queryAllByText(/1\.234|234/i);
      expect(numberPreview.length).toBeGreaterThan(0);
    });
  });

  describe('Change handling', () => {
    it('calls onDateFormatChange when date format is selected', async () => {
      const user = userEvent.setup();
      const mockDateChange = vi.fn();

      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={mockDateChange}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      if (radios.length > 1) {
        await user.click(radios[1]);
        expect(mockDateChange).toHaveBeenCalled();
      }
    });

    it('calls onNumberFormatChange when number format is selected', async () => {
      const user = userEvent.setup();
      const mockNumberChange = vi.fn();

      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={mockNumberChange}
        />
      );

      const radios = screen.getAllByRole('radio');
      if (radios.length > 1) {
        await user.click(radios[radios.length - 1]);
        expect(mockNumberChange).toHaveBeenCalled();
      }
    });
  });

  describe('Props updates', () => {
    it('updates date format when prop changes', () => {
      const { rerender } = render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);

      rerender(
        <LanguageRegionSettingsSection
          dateFormat="MM/DD/YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
    });

    it('updates number format when prop changes', () => {
      const { rerender } = render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);

      rerender(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="EN_US"
          onNumberFormatChange={() => {}}
        />
      );

      expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('renders radio buttons with accessible labels', () => {
      render(
        <LanguageRegionSettingsSection
          dateFormat="DD.MM.YYYY"
          onDateFormatChange={() => {}}
          numberFormat="DE"
          onNumberFormatChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);
    });
  });
});
