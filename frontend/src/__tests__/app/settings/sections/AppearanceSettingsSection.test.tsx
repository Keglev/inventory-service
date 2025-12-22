/**
 * @file AppearanceSettingsSection.test.tsx
 *
 * @what_is_under_test AppearanceSettingsSection component
 * @responsibility Table density selector with radio button group
 * @out_of_scope Density application, UI theme changes, styling persistence
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceSettingsSection from '../../../../app/settings/sections/AppearanceSettingsSection';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

describe('AppearanceSettingsSection', () => {
  describe('Radio group rendering', () => {
    it('renders form control with radio group', () => {
      const { container } = render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const radioGroup = container.querySelector('.MuiRadioGroup-root');
      expect(radioGroup).toBeInTheDocument();
    });

    it('renders form label for density', () => {
      const { container } = render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const label = container.querySelector('.MuiFormLabel-root');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Density options', () => {
    it('renders comfortable density option', () => {
      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const comfortableOption = screen.getByRole('radio', { name: /comfortable|normal/i });
      expect(comfortableOption).toBeInTheDocument();
    });

    it('renders compact density option', () => {
      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const compactOption = screen.getByRole('radio', { name: /compact/i });
      expect(compactOption).toBeInTheDocument();
    });

    it('selects comfortable density when prop is comfortable', () => {
      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const comfortableRadio = screen.getByRole('radio', { name: /comfortable|normal/i });
      expect((comfortableRadio as HTMLInputElement).checked).toBe(true);
    });

    it('selects compact density when prop is compact', () => {
      render(
        <AppearanceSettingsSection
          tableDensity="compact"
          onTableDensityChange={() => {}}
        />
      );

      const compactRadio = screen.getByRole('radio', { name: /compact/i });
      expect((compactRadio as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('Change handling', () => {
    it('calls onTableDensityChange when comfortable option is selected', async () => {
      const user = userEvent.setup();
      const mockChange = vi.fn();

      render(
        <AppearanceSettingsSection
          tableDensity="compact"
          onTableDensityChange={mockChange}
        />
      );

      const comfortableRadio = screen.getByRole('radio', { name: /comfortable|normal/i });
      await user.click(comfortableRadio);

      expect(mockChange).toHaveBeenCalledWith('comfortable');
    });

    it('calls onTableDensityChange when compact option is selected', async () => {
      const user = userEvent.setup();
      const mockChange = vi.fn();

      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={mockChange}
        />
      );

      const compactRadio = screen.getByRole('radio', { name: /compact/i });
      await user.click(compactRadio);

      expect(mockChange).toHaveBeenCalledWith('compact');
    });
  });

  describe('Props updates', () => {
    it('updates selected option when tableDensity prop changes', () => {
      const { rerender } = render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const comfortableRadio = screen.getByRole('radio', { name: /comfortable|normal/i });
      expect((comfortableRadio as HTMLInputElement).checked).toBe(true);

      rerender(
        <AppearanceSettingsSection
          tableDensity="compact"
          onTableDensityChange={() => {}}
        />
      );

      const compactRadio = screen.getByRole('radio', { name: /compact/i });
      expect((compactRadio as HTMLInputElement).checked).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('renders radio buttons with proper labels', () => {
      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={() => {}}
        />
      );

      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBeGreaterThanOrEqual(2);
    });

    it('radio buttons are keyboard accessible', async () => {
      const user = userEvent.setup();
      const mockChange = vi.fn();

      render(
        <AppearanceSettingsSection
          tableDensity="comfortable"
          onTableDensityChange={mockChange}
        />
      );

      const compactRadio = screen.getByRole('radio', { name: /compact/i });
      compactRadio.focus();
      await user.keyboard(' ');

      expect(mockChange).toHaveBeenCalled();
    });
  });
});
