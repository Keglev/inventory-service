/**
 * @file AllClearNotificationSection.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationSettings
 *
 * @description
 * Unit tests for <AllClearNotificationSection /> — the "no issues" state shown when
 * there are no low-stock notifications.
 *
 * Test strategy:
 * - Verify the default message renders (baseline UX).
 * - Verify the component includes an icon (light regression guard).
 * - Verify i18n wiring by mocking translations.
 *
 * Notes:
 * - We intentionally do NOT assert the exact rendered color value. The component uses
 *   MUI theme tokens (success.main), which are resolved at runtime from the theme and
 *   are not stable in jsdom or across theme changes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AllClearNotificationSection from '../../../../app/HamburgerMenu/NotificationSettings/AllClearNotificationSection';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('AllClearNotificationSection', () => {
  const arrange = () => render(<AllClearNotificationSection />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders the all-clear message', () => {
    arrange();
    expect(screen.getByText('All clear – no low stock items')).toBeInTheDocument();
  });

  it('renders the notifications icon', () => {
    const { container } = arrange();

    // MUI icons render as SVG. This is a lightweight regression guard.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the translated message when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'notifications.allGood') return 'Alles in Ordnung – keine niedrigen Bestände';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(
      screen.getByText('Alles in Ordnung – keine niedrigen Bestände'),
    ).toBeInTheDocument();

    expect(mockT).toHaveBeenCalledWith(
      'notifications.allGood',
      'All clear – no low stock items',
    );
  });

  it('renders the message as caption text (Typography variant)', () => {
    const { container } = arrange();

    // Stable semantic check: the component uses Typography variant="caption".
    // In MUI, this typically results in a class like "MuiTypography-caption".
    const caption = container.querySelector('.MuiTypography-caption');
    expect(caption).toBeInTheDocument();
  });
});
