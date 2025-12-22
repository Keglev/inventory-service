/**
 * @file MenuSectionsRenderer.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent/MenuSectionsRenderer
 * @description Tests for menu sections renderer component.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuSectionsRenderer from '../../../../app/HamburgerMenu/MenuContent/MenuSectionsRenderer';

// Hoisted mocks
const mockProfileMenuSection = vi.hoisted(() => vi.fn(() => <div>Profile Section</div>));
const mockAppearanceMenuSection = vi.hoisted(() => vi.fn(() => <div>Appearance Section</div>));
const mockLanguageRegionMenuSection = vi.hoisted(() => vi.fn(() => <div>Language Section</div>));
const mockNotificationsMenuSection = vi.hoisted(() => vi.fn(() => <div>Notifications Section</div>));
const mockHelpDocsMenuSection = vi.hoisted(() => vi.fn(() => <div>Help Section</div>));
const mockSystemInfoMenuSection = vi.hoisted(() => vi.fn(() => <div>System Info Section</div>));

// Mock menu section components
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

describe('MenuSectionsRenderer', () => {
  const mockOnThemeModeChange = vi.fn();
  const mockOnLocaleChange = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    themeMode: 'light' as const,
    onThemeModeChange: mockOnThemeModeChange,
    locale: 'en' as const,
    onLocaleChange: mockOnLocaleChange,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileMenuSection.mockReturnValue(<div>Profile Section</div>);
    mockAppearanceMenuSection.mockReturnValue(<div>Appearance Section</div>);
    mockLanguageRegionMenuSection.mockReturnValue(<div>Language Section</div>);
    mockNotificationsMenuSection.mockReturnValue(<div>Notifications Section</div>);
    mockHelpDocsMenuSection.mockReturnValue(<div>Help Section</div>);
    mockSystemInfoMenuSection.mockReturnValue(<div>System Info Section</div>);
  });

  it('renders all menu sections', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(screen.getByText('Profile Section')).toBeInTheDocument();
    expect(screen.getByText('Appearance Section')).toBeInTheDocument();
    expect(screen.getByText('Language Section')).toBeInTheDocument();
    expect(screen.getByText('Notifications Section')).toBeInTheDocument();
    expect(screen.getByText('Help Section')).toBeInTheDocument();
    expect(screen.getByText('System Info Section')).toBeInTheDocument();
  });

  it('passes theme props to AppearanceMenuSection', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockAppearanceMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        themeMode: 'light',
        onThemeModeChange: mockOnThemeModeChange,
      }),
      undefined
    );
  });

  it('passes locale props to LanguageRegionMenuSection', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockLanguageRegionMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'en',
        onLocaleChange: mockOnLocaleChange,
      }),
      undefined
    );
  });

  it('passes dark theme mode correctly', () => {
    render(<MenuSectionsRenderer {...defaultProps} themeMode="dark" />);
    
    expect(mockAppearanceMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        themeMode: 'dark',
      }),
      undefined
    );
  });

  it('passes German locale correctly', () => {
    render(<MenuSectionsRenderer {...defaultProps} locale="de" />);
    
    expect(mockLanguageRegionMenuSection).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: 'de',
      }),
      undefined
    );
  });

  it('renders ProfileMenuSection without props', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockProfileMenuSection).toHaveBeenCalledWith(
      {},
      undefined
    );
  });

  it('renders NotificationsMenuSection without props', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockNotificationsMenuSection).toHaveBeenCalledWith(
      {},
      undefined
    );
  });

  it('renders HelpDocsMenuSection without props', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockHelpDocsMenuSection).toHaveBeenCalledWith(
      {},
      undefined
    );
  });

  it('renders SystemInfoMenuSection without props', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockSystemInfoMenuSection).toHaveBeenCalledWith(
      {},
      undefined
    );
  });

  it('renders sections in correct order', () => {
    render(<MenuSectionsRenderer {...defaultProps} />);
    
    expect(mockProfileMenuSection).toHaveBeenCalled();
    expect(mockAppearanceMenuSection).toHaveBeenCalled();
    expect(mockLanguageRegionMenuSection).toHaveBeenCalled();
    expect(mockNotificationsMenuSection).toHaveBeenCalled();
    expect(mockHelpDocsMenuSection).toHaveBeenCalled();
    expect(mockSystemInfoMenuSection).toHaveBeenCalled();
  });
});
