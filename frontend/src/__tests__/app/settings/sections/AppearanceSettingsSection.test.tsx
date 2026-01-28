/**
 * @file AppearanceSettingsSection.test.tsx
 * @module __tests__/app/settings/sections/AppearanceSettingsSection
 * @description
 * Tests for AppearanceSettingsSection.
 *
 * Scope:
 * - Renders the table density setting using an accessible radio group
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
import AppearanceSettingsSection from '../../../../app/settings/sections/AppearanceSettingsSection';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    // Deterministic translations: prefer fallback when provided, else key.
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

type Density = 'comfortable' | 'compact';

describe('AppearanceSettingsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSection(params?: { tableDensity?: Density; onChange?: (d: Density) => void }) {
    const tableDensity = params?.tableDensity ?? 'comfortable';
    const onTableDensityChange = params?.onChange ?? vi.fn();

    return {
      ...render(
        <AppearanceSettingsSection
          tableDensity={tableDensity}
          onTableDensityChange={onTableDensityChange}
        />,
      ),
      onTableDensityChange,
    };
  }

  function getComfortableRadio() {
    // Label is translated; match both common text variants.
    return screen.getByRole('radio', { name: /comfortable|normal/i });
  }

  function getCompactRadio() {
    return screen.getByRole('radio', { name: /compact/i });
  }

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

    // Tab focuses the currently selected radio; arrow key moves selection within the group.
    await user.tab();
    await user.keyboard('{ArrowDown}');

    expect(onChange).toHaveBeenCalledWith('compact');
  });
});
