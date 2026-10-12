/**
 * @file LowStockAlertSection.test.tsx
 * @module __tests__/app/HamburgerMenu/NotificationSettings
 *
 * @description
 * Unit tests for <LowStockAlertSection /> — displays an alert when items are below minimum stock.
 *
 * Responsibilities:
 * - Render an alert title.
 * - Render a message containing the dynamic low-stock count.
 * - Show the count once: the former chip repeated it ("X items below minimum") and is gone (FW5).
 *
 * Test strategy:
 * - Verify baseline rendering (title, icon, no chip).
 * - Verify count interpolation in the message for multiple scenarios (0, 1, many).
 * - Verify i18n integration by mocking translations for the title.
 *
 * Notes:
 * - i18n interpolation is mocked in a minimal way to support `{{count}}` placeholders.
 * - We avoid asserting exact styling; instead, we assert presence of core UI elements.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tEn } from '@/__tests__/test/i18nEn';
import { render, screen } from '@testing-library/react';
import LowStockAlertSection from '@/app/HamburgerMenu/NotificationSettings/LowStockAlertSection';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type TOptions = { count?: number };

describe('LowStockAlertSection', () => {
  /**
   * Arrange helper: renders the component with a specific lowStockCount.
   */
  const arrange = (lowStockCount: number) =>
    render(<LowStockAlertSection lowStockCount={lowStockCount} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default deterministic translation stub: return defaultValue with count interpolation.
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: baseline structure
  // ---------------------------------------------------------------------------
  it('renders the low stock alert title', () => {
    arrange(5);
    expect(screen.getByText('Alert: items below minimum')).toBeInTheDocument();
  });

  it('renders a notification icon', () => {
    const { container } = arrange(5);

    // MUI icons render as SVG. Lightweight regression guard.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders no chip that repeats the count', () => {
    const { container } = arrange(5);

    // Paired presence: the message with the count rendered.
    expect(screen.getByText('You have 5 item(s) below minimum')).toBeInTheDocument();
    expect(container.querySelector('.MuiChip-root')).toBeNull();
    expect(screen.queryByText('5 items below minimum')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Count rendering: message
  // ---------------------------------------------------------------------------
  it.each([
    [0, 'You have 0 item(s) below minimum', '0 items below minimum'],
    [1, 'You have 1 item(s) below minimum', '1 items below minimum'],
    [3, 'You have 3 item(s) below minimum', '3 items below minimum'],
    [999, 'You have 999 item(s) below minimum', '999 items below minimum'],
  ] as const)(
    'renders count-dependent content for lowStockCount=%i',
    (count, expectedMessage, expectedChip) => {
      arrange(count);
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      expect(screen.queryByText(expectedChip)).not.toBeInTheDocument();
    },
  );

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated title when provided by i18n', () => {
    const mockT = vi.fn((key: string, options?: TOptions) => {
      if (key === 'notifications.lowStockAlert') return 'Warnung: Artikel unter Mindestbestand';
      return tEn(key, options);
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange(5);

    // User-visible result
    expect(screen.getByText('Warnung: Artikel unter Mindestbestand')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('notifications.lowStockAlert');
  });
});
