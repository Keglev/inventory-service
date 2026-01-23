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
 * - Render a chip summarizing the count ("X items below minimum").
 *
 * Test strategy:
 * - Verify baseline rendering (title, icon, chip).
 * - Verify count interpolation in message and chip for multiple scenarios (0, 1, many).
 * - Verify i18n integration by mocking translations for the title.
 *
 * Notes:
 * - i18n interpolation is mocked in a minimal way to support `{{count}}` placeholders.
 * - We avoid asserting exact styling; instead, we assert presence of core UI elements.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LowStockAlertSection from '../../../../app/HamburgerMenu/NotificationSettings/LowStockAlertSection';

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
   * Minimal interpolation helper for `{{count}}` placeholders.
   * Keeps tests deterministic without requiring the full i18next engine.
   */
  const interpolateCount = (template: unknown, options?: TOptions) => {
    if (typeof template === 'string' && options?.count !== undefined) {
      return template.replace('{{count}}', String(options.count));
    }
    return template;
  };

  /**
   * Arrange helper: renders the component with a specific lowStockCount.
   */
  const arrange = (lowStockCount: number) =>
    render(<LowStockAlertSection lowStockCount={lowStockCount} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Default deterministic translation stub: return defaultValue with count interpolation.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string, options?: TOptions) =>
        interpolateCount(defaultValue, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: baseline structure
  // ---------------------------------------------------------------------------
  it('renders the low stock alert title', () => {
    arrange(5);
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument();
  });

  it('renders a notification icon', () => {
    const { container } = arrange(5);

    // MUI icons render as SVG. Lightweight regression guard.
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a chip summary', () => {
    const { container } = arrange(5);

    // MUI Chip root class is a reasonable stable hook.
    expect(container.querySelector('.MuiChip-root')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Count rendering: message + chip
  // ---------------------------------------------------------------------------
  it.each([
    [0, 'You have 0 merchandise item(s) with low stock', '0 items below minimum'],
    [1, 'You have 1 merchandise item(s) with low stock', '1 items below minimum'],
    [3, 'You have 3 merchandise item(s) with low stock', '3 items below minimum'],
    [999, 'You have 999 merchandise item(s) with low stock', '999 items below minimum'],
  ] as const)(
    'renders count-dependent content for lowStockCount=%i',
    (count, expectedMessage, expectedChip) => {
      arrange(count);
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
      expect(screen.getByText(expectedChip)).toBeInTheDocument();
    },
  );

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated title when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string, options?: TOptions) => {
      if (key === 'notifications.lowStockAlert') return 'Niedriger Bestand';
      return interpolateCount(defaultValue, options);
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange(5);

    // User-visible result
    expect(screen.getByText('Niedriger Bestand')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('notifications.lowStockAlert', 'Low Stock Alert');
  });
});
