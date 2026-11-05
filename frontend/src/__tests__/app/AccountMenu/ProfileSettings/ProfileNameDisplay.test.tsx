/**
 * @file ProfileNameDisplay.test.tsx
 * @module __tests__/app/AccountMenu/ProfileSettings/ProfileNameDisplay
 *
 * @description
 * Unit tests for <ProfileNameDisplay /> — renders a user's full name in the profile section.
 *
 * Behavior:
 * - If a full name is provided, render it.
 * - If missing/empty, render an em dash placeholder.
 *
 * Test strategy:
 * - Verify label and value rendering.
 * - Verify fallback rendering for missing/empty input.
 * - Verify i18n wiring by mocking translations for the label.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileNameDisplay from '@/app/AccountMenu/ProfileSettings/ProfileNameDisplay';
import { tEn } from '@/__tests__/test/i18nEn';

const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

describe('ProfileNameDisplay', () => {
  /**
   * Arrange helper: render with optional fullName.
   */
  const arrange = (fullName?: string) => render(<ProfileNameDisplay fullName={fullName} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // tEn resolves keys against the real English locale files.
    mockUseTranslation.mockReturnValue({
      t: (key: string, options?: Record<string, unknown>) => tEn(key, options),
      i18n: { changeLanguage: vi.fn() },
    });
  });

  it('renders the name label', () => {
    arrange('John Doe');
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('renders the full name when provided', () => {
    arrange('John Doe');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it.each([
    ['missing fullName prop', undefined],
    ['empty fullName string', ''],
  ] as const)('renders an em dash when fullName is %s', (_case, fullName) => {
    arrange(fullName);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders translated label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:name') return 'Vollständiger Name';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange('John Doe');

    // User-visible outcome
    expect(screen.getByText('Vollständiger Name')).toBeInTheDocument();

    // Integration: correct key used
    expect(mockT).toHaveBeenCalledWith('common:name');
  });

  it('renders long names', () => {
    const longName = 'Johann Wolfgang von Goethe Maximilian Schmidt';
    arrange(longName);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  it('renders names with special characters', () => {
    arrange("José María O'Brien");
    expect(screen.getByText("José María O'Brien")).toBeInTheDocument();
  });
});
