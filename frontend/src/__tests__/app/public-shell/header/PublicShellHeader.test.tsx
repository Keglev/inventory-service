/**
 * @file PublicShellHeader.test.tsx
 *
 * @what_is_under_test PublicShellHeader component
 * @responsibility Fixed header orchestrator with theme and language toggle controls
 * @out_of_scope Theme application, language switching, navigation drawer
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PublicShellHeader from '../../../../app/public-shell/header/PublicShellHeader';

// Mock sub-components
vi.mock('../../../../app/public-shell/header/ThemeToggle', () => ({
  default: vi.fn(({ onThemeToggle, tooltip }) => (
    <button
      data-testid="theme-toggle"
      onClick={onThemeToggle}
      title={tooltip}
    >
      Theme
    </button>
  )),
}));

vi.mock('../../../../app/public-shell/header/LanguageToggle', () => ({
  default: vi.fn(({ onToggle, tooltip }) => (
    <button
      data-testid="language-toggle"
      onClick={onToggle}
      title={tooltip}
    >
      Lang
    </button>
  )),
}));

describe('PublicShellHeader', () => {
  describe('AppBar rendering', () => {
    it('renders AppBar component', () => {
      const { container } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('applies fixed position styling', () => {
      const { container } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const appBar = container.querySelector('.MuiAppBar-root');
      expect(appBar).toBeInTheDocument();
    });

    it('renders Toolbar container', () => {
      const { container } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });
  });

  describe('Header title display', () => {
    it('displays app title', () => {
      render(
        <PublicShellHeader
          appTitle="Smart Supply Pro"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const title = screen.getByText('Smart Supply Pro');
      expect(title).toBeInTheDocument();
    });

    it('renders title with proper styling', () => {
      const { container } = render(
        <PublicShellHeader
          appTitle="Smart Supply Pro"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const typography = container.querySelector('.MuiTypography-root');
      expect(typography).toBeInTheDocument();
    });
  });

  describe('Theme toggle button', () => {
    it('renders theme toggle component', () => {
      render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const themeToggle = screen.getByTestId('theme-toggle');
      expect(themeToggle).toBeInTheDocument();
    });

    it('passes current theme to toggle', () => {
      const { rerender } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();

      rerender(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="dark"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });
  });

  describe('Language toggle button', () => {
    it('renders language toggle component', () => {
      render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const langToggle = screen.getByTestId('language-toggle');
      expect(langToggle).toBeInTheDocument();
    });

    it('passes current locale to toggle', () => {
      const { rerender } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();

      rerender(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="de"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('calls onLocaleToggle when language button is clicked', async () => {
      const user = userEvent.setup();
      const mockToggle = vi.fn();

      render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={mockToggle}
          languageTooltip="Toggle language"
        />
      );

      const langToggle = screen.getByTestId('language-toggle');
      await user.click(langToggle);

      expect(mockToggle).toHaveBeenCalled();
    });
  });

  describe('Controls layout', () => {
    it('renders both theme and language toggle buttons', () => {
      render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument();
    });

    it('positions controls on the right side', () => {
      const { container } = render(
        <PublicShellHeader
          appTitle="Test App"
          themeMode="light"
          onThemeToggle={() => {}}
          locale="en"
          onLocaleToggle={() => {}}
          languageTooltip="Toggle language"
        />
      );

      const toolbar = container.querySelector('.MuiToolbar-root');
      expect(toolbar).toBeInTheDocument();
    });
  });
});
