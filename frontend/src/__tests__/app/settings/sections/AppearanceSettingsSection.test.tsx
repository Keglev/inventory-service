/**
 * @file AppearanceSettingsSection.test.tsx
 * @module __tests__/app/settings/sections/AppearanceSettingsSection
 * @description
 * Tests for AppearanceSettingsSection.
 *
 * Scope:
 * - Renders the theme setting (light/dark) and the table density setting as radio groups
 * - Reflects the themeMode prop and delegates theme changes to onThemeModeChange
 * - Reflects current selection based on the tableDensity prop
 * - Delegates user changes to onTableDensityChange
 * - Supports keyboard interaction (accessibility baseline)
 *
 * Out of scope:
 * - Applying density to actual tables/components
 * - Persisting user preferences
 * - Theme/styling details beyond semantic behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceSettingsSection from '@/app/settings/sections/AppearanceSettingsSection';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Deterministic translations: prefer fallback when provided, else key.
    t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
  }),
}));

type Density = 'comfortable' | 'compact';

describe('AppearanceSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const themeProps = { themeMode: 'light' as const, onThemeModeChange: vi.fn() };

  function renderSection(params?: {
    tableDensity?: Density;
    onChange?: (d: Density) => void;
    themeMode?: 'light' | 'dark';
    onThemeModeChange?: (m: 'light' | 'dark') => void;
  }) {
    const tableDensity = params?.tableDensity ?? 'comfortable';
    const onTableDensityChange = params?.onChange ?? vi.fn();
    const themeMode = params?.themeMode ?? 'light';
    const onThemeModeChange = params?.onThemeModeChange ?? vi.fn();

    return {
      ...render(
        <AppearanceSettingsSection
          themeMode={themeMode}
          onThemeModeChange={onThemeModeChange}
          tableDensity={tableDensity}
          onTableDensityChange={onTableDensityChange}
        />,
      ),
      onTableDensityChange,
      onThemeModeChange,
    };
  }

  function getComfortableRadio() {
    // Label is translated; match both common text variants.
    return screen.getByRole('radio', { name: /comfortable|normal/i });
  }

  function getCompactRadio() {
    return screen.getByRole('radio', { name: /compact/i });
  }

  it('renders the theme options and reflects the themeMode prop', () => {
    renderSection({ themeMode: 'dark' });

    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
  });

  it('calls onThemeModeChange when the user selects the other theme', async () => {
    const user = userEvent.setup();
    const onThemeModeChange = vi.fn();
    renderSection({ themeMode: 'light', onThemeModeChange });

    await user.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(onThemeModeChange).toHaveBeenCalledWith('dark');
  });

  it('renders an accessible radio group with at least two options', () => {
    // Accessibility contract: densities are selectable via radio buttons.
    renderSection();

    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThanOrEqual(2);

    expect(getComfortableRadio()).toBeInTheDocument();
    expect(getCompactRadio()).toBeInTheDocument();
  });

  it('reflects the selected density from the tableDensity prop', () => {
    // UI contract: the component is controlled via props.
    const { rerender, onTableDensityChange } = renderSection({ tableDensity: 'comfortable' });
    expect(getComfortableRadio()).toBeChecked();

    rerender(
      <AppearanceSettingsSection
        {...themeProps}
        tableDensity="compact"
        onTableDensityChange={onTableDensityChange}
      />,
    );

    expect(getCompactRadio()).toBeChecked();
  });

  it('calls onTableDensityChange when the user selects a different option', async () => {
    // Behavior contract: selecting an option triggers the callback with the selected value.
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderSection({ tableDensity: 'compact', onChange });

    await user.click(getComfortableRadio());
    expect(onChange).toHaveBeenCalledWith('comfortable');
  });

  it('updates selection when tableDensity prop changes', () => {
    // Regression guard: rerendering with a new prop updates the checked radio.
    const { rerender } = renderSection({ tableDensity: 'comfortable' });

    expect(getComfortableRadio()).toBeChecked();

    rerender(
      <AppearanceSettingsSection
        {...themeProps}
        tableDensity="compact"
        onTableDensityChange={vi.fn()}
      />,
    );

    expect(getCompactRadio()).toBeChecked();
  });

  it('supports keyboard interaction for radio selection', async () => {
    // Accessibility contract: radio options are reachable and selectable via keyboard.
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderSection({ tableDensity: 'comfortable', onChange });

    // Tab focuses the checked radio of each group in turn: theme first, then density;
    // the arrow key moves selection within the density group.
    await user.tab();
    await user.tab();
    await user.keyboard('{ArrowDown}');

    expect(onChange).toHaveBeenCalledWith('compact');
  });
});
