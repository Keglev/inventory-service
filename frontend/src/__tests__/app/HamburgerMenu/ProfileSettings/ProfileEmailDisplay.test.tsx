/**
 * @file ProfileEmailDisplay.test.tsx
 * @module __tests__/app/HamburgerMenu/ProfileSettings
 *
 * @description
 * Unit tests for <ProfileEmailDisplay /> — renders an email field in the profile section.
 *
 * Behavior:
 * - In normal mode: show the email value when provided, otherwise show an em dash placeholder.
 * - In demo mode: show a demo message and do NOT show the email address.
 *
 * Test strategy:
 * - Verify label rendering.
 * - Verify demo vs non-demo behavior.
 * - Verify fallback behavior when email is missing/empty.
 * - Verify i18n wiring by mocking translations for the label and demo message.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProfileEmailDisplay from '../../../../app/HamburgerMenu/ProfileSettings/ProfileEmailDisplay';

// -----------------------------------------------------------------------------
// i18n mock
// -----------------------------------------------------------------------------
const mockUseTranslation = vi.hoisted(() => vi.fn());

vi.mock('react-i18next', () => ({
  useTranslation: mockUseTranslation,
}));

type Props = {
  email?: string;
  isDemo: boolean;
};

describe('ProfileEmailDisplay', () => {
  const defaultProps: Props = {
    email: 'user@example.com',
    isDemo: false,
  };

  /**
   * Arrange helper: render with defaults + optional overrides.
   */
  const arrange = (overrides?: Partial<Props>) =>
    render(<ProfileEmailDisplay {...defaultProps} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();

    // Deterministic translation stub: return defaultValue for stable assertions.
    mockUseTranslation.mockReturnValue({
      t: (_key: string, defaultValue: string) => defaultValue,
      i18n: { changeLanguage: vi.fn() },
    });
  });

  // ---------------------------------------------------------------------------
  // Rendering: label
  // ---------------------------------------------------------------------------
  it('renders the email label', () => {
    arrange();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Non-demo behavior
  // ---------------------------------------------------------------------------
  it('displays the email when provided and not in demo mode', () => {
    arrange({ isDemo: false, email: 'user@example.com' });
    expect(screen.getByText('user@example.com')).toBeInTheDocument();
  });

  it.each([
    ['missing email prop', undefined],
    ['empty email string', ''],
  ] as const)('renders an em dash when email is %s', (_case, email) => {
    arrange({ isDemo: false, email });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Demo behavior
  // ---------------------------------------------------------------------------
  it('displays the demo message when demo mode is enabled', () => {
    arrange({ isDemo: true });
    expect(screen.getByText('Demo Account, No email provided')).toBeInTheDocument();
  });

  it('does not display the email address when demo mode is enabled', () => {
    arrange({ isDemo: true, email: 'user@example.com' });
    expect(screen.queryByText('user@example.com')).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // i18n wiring
  // ---------------------------------------------------------------------------
  it('renders translated email label when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'common:email') return 'E-Mail';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange();

    expect(screen.getByText('E-Mail')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith('common:email', 'Email');
  });

  it('renders translated demo message when provided by i18n', () => {
    const mockT = vi.fn((key: string, defaultValue: string) => {
      if (key === 'auth:demo.noEmailProvided') return 'Demo-Konto, keine E-Mail';
      if (key === 'common:email') return 'Email';
      return defaultValue;
    });

    mockUseTranslation.mockReturnValue({
      t: mockT,
      i18n: { changeLanguage: vi.fn() },
    });

    arrange({ isDemo: true });

    expect(screen.getByText('Demo-Konto, keine E-Mail')).toBeInTheDocument();
    expect(mockT).toHaveBeenCalledWith(
      'auth:demo.noEmailProvided',
      'Demo Account, No email provided',
    );
  });

  // ---------------------------------------------------------------------------
  // Regression: long values
  // ---------------------------------------------------------------------------
  it('renders long email addresses', () => {
    const longEmail = 'very.long.email.address@subdomain.example.com';
    arrange({ isDemo: false, email: longEmail });
    expect(screen.getByText(longEmail)).toBeInTheDocument();
  });
});
