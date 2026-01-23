/**
 * @file MenuSectionsRenderer.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent
 *
 * @description
 * Unit tests for <MenuSectionsRenderer /> — composition component that renders all
 * hamburger menu sections and wires props to the sections that need them.
 *
 * Test strategy:
 * - Render verification: all sections appear in the DOM.
 * - Prop wiring verification:
 *   - AppearanceMenuSection receives theme props.
 *   - LanguageRegionMenuSection receives locale props.
 *   - Other sections receive no props.
 * - Order verification: sections are rendered in the expected sequence.
 *
 * Notes:
 * - We mock each section component as a simple functional component that renders a unique
 *   marker text. This isolates the renderer from the section implementations.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuSectionsRenderer from '../../../../app/HamburgerMenu/MenuContent/MenuSectionsRenderer';

// -----------------------------------------------------------------------------
// Section component mocks
// -----------------------------------------------------------------------------
// Hoisted so mocks exist before vi.mock factory evaluation.
const mockProfileMenuSection = vi.hoisted(() => vi.fn(() => <div>Profile Section</div>));
const mockAppearanceMenuSection = vi.hoisted(() => vi.fn(() => <div>Appearance Section</div>));
const mockLanguageRegionMenuSection = vi.hoisted(() => vi.fn(() => <div>Language Section</div>));
const mockNotificationsMenuSection = vi.hoisted(() => vi.fn(() => <div>Notifications Section</div>));
const mockHelpDocsMenuSection = vi.hoisted(() => vi.fn(() => <div>Help Section</div>));
const mockSystemInfoMenuSection = vi.hoisted(() => vi.fn(() => <div>System Info Section</div>));

vi.mock('../../../../app/HamburgerMenu/ProfileMenuSection', () => ({
  default: mockProfileMenuSection,
}));

vi.mock('../../../../app/HamburgerMenu/AppearanceMenuSection', () => ({
  default: mockAppearanceMenuSection,
}));

vi.mock('../../../../app/HamburgerMenu/LanguageRegionMenuSection', () => ({
  default: mockLanguageRegionMenuSection,
}));

vi.mock('../../../../app/HamburgerMenu/NotificationsMenuSection', () => ({
  default: mockNotificationsMenuSection,
}));

vi.mock('../../../../app/HamburgerMenu/HelpDocsMenuSection', () => ({
  default: mockHelpDocsMenuSection,
}));

vi.mock('../../../../app/HamburgerMenu/SystemInfoMenuSection', () => ({
  default: mockSystemInfoMenuSection,
}));

type ThemeMode = 'light' | 'dark';
type Locale = 'en' | 'de';

type Props = {
  themeMode: ThemeMode;
  onThemeModeChange: () => void;
  locale: Locale;
  onLocaleChange: () => void;
  onClose: () => void;
};

describe('MenuSectionsRenderer', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps: Props = {
    themeMode: 'light',
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en',
    onLocaleChange: mockOnLocaleChange,
    onClose: mockOnClose,
  };

  /**
   * Arrange helper: renders with defaults + optional overrides.
   */
  const arrange = (overrides?: Partial<Props>) =>
    render(<MenuSectionsRenderer {...defaultProps} {...overrides} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Rendering: all sections appear
  // ---------------------------------------------------------------------------
  it('renders all menu sections', () => {
    arrange();

    expect(screen.getByText('Profile Section')).toBeInTheDocument();
    expect(screen.getByText('Appearance Section')).toBeInTheDocument();
    expect(screen.getByText('Language Section')).toBeInTheDocument();
    expect(screen.getByText('Notifications Section')).toBeInTheDocument();
    expect(screen.getByText('Help Section')).toBeInTheDocument();
    expect(screen.getByText('System Info Section')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: sections that require props
  // ---------------------------------------------------------------------------
  it('passes theme props to AppearanceMenuSection', () => {
    arrange();

    expect(mockAppearanceMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        themeMode: 'light',
        onThemeModeChange: mockOnThemeModeChange,
      }),
      undefined,
    );
  });

  it('passes locale props to LanguageRegionMenuSection', () => {
    arrange();

    expect(mockLanguageRegionMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        onLocaleChange: mockOnLocaleChange,
      }),
      undefined,
    );
  });

  it('supports dark theme mode', () => {
    arrange({ themeMode: 'dark' });

    expect(mockAppearanceMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({ themeMode: 'dark' }),
      undefined,
    );
  });

  it('supports German locale', () => {
    arrange({ locale: 'de' });

    expect(mockLanguageRegionMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'de' }),
      undefined,
    );
  });

  // ---------------------------------------------------------------------------
  // Prop wiring: sections that should receive no props
  // ---------------------------------------------------------------------------
  it('renders ProfileMenuSection without props', () => {
    arrange();
    expect(mockProfileMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  it('renders NotificationsMenuSection without props', () => {
    arrange();
    expect(mockNotificationsMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  it('renders HelpDocsMenuSection without props', () => {
    arrange();
    expect(mockHelpDocsMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  it('renders SystemInfoMenuSection without props', () => {
    arrange();
    expect(mockSystemInfoMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  // ---------------------------------------------------------------------------
  // Order verification
  // ---------------------------------------------------------------------------
  it('renders sections in the expected order', () => {
    arrange();

    // "Called" alone does not prove order. Vitest exposes call order numbers per mock.
    const order = [
      mockProfileMenuSection.mock.invocationCallOrder[0],
      mockAppearanceMenuSection.mock.invocationCallOrder[0],
      mockLanguageRegionMenuSection.mock.invocationCallOrder[0],
      mockNotificationsMenuSection.mock.invocationCallOrder[0],
      mockHelpDocsMenuSection.mock.invocationCallOrder[0],
      mockSystemInfoMenuSection.mock.invocationCallOrder[0],
    ];

    // Assert strict increasing order of invocation.
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
