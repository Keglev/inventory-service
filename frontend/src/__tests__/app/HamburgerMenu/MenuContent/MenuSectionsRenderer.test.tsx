/**
 * @file MenuSectionsRenderer.test.tsx
 * @module __tests__/app/HamburgerMenu/MenuContent
 * @testing Vitest + React Testing Library; section components mocked as marker text
 * @description
 * Unit tests for <MenuSectionsRenderer /> — the user menu body (FW5 fork 1).
 *
 * Contract:
 * - Renders profile, the Settings and About entries, and help links, in that order.
 * - Holds no preference editors, no notifications and no inline system info.
 * - Settings and About each close the menu, then open their dialog.
 * - Clicking inside a section closes the menu; sections receive no props.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tEn } from '@/__tests__/test/i18nEn';
import MenuSectionsRenderer from '@/app/HamburgerMenu/MenuContent/MenuSectionsRenderer';

const mockProfileMenuSection = vi.hoisted(() => vi.fn(() => <div>Profile Section</div>));
const mockHelpDocsMenuSection = vi.hoisted(() => vi.fn(() => <div>Help Section</div>));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => tEn(key, options) }),
}));
vi.mock('@/app/HamburgerMenu/ProfileMenuSection', () => ({ default: mockProfileMenuSection }));
vi.mock('@/app/HamburgerMenu/HelpDocsMenuSection', () => ({ default: mockHelpDocsMenuSection }));

describe('MenuSectionsRenderer', () => {
  const onSettingsOpen = vi.fn();
  const onAboutOpen = vi.fn();
  const onClose = vi.fn();

  const arrange = () =>
    render(<MenuSectionsRenderer onSettingsOpen={onSettingsOpen} onAboutOpen={onAboutOpen} onClose={onClose} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders profile, the settings and about entries, and help', () => {
    arrange();
    expect(screen.getByText('Profile Section')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Settings…' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'About Smart Supply Pro' })).toBeInTheDocument();
    expect(screen.getByText('Help Section')).toBeInTheDocument();
  });

  it('renders no preference editors, notifications or inline system info', () => {
    arrange();
    // Translated headings of the removed blocks.
    expect(screen.queryByText(/Appearance|Language|Notifications|System Info|Version/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('closes the menu and then opens the About dialog when About is clicked', async () => {
    const user = userEvent.setup();
    arrange();
    await user.click(screen.getByRole('menuitem', { name: 'About Smart Supply Pro' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAboutOpen).toHaveBeenCalledTimes(1);
    expect(onSettingsOpen).not.toHaveBeenCalled();
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onAboutOpen.mock.invocationCallOrder[0]);
  });

  it('closes the menu and then opens the settings dialog when Settings is clicked', async () => {
    const user = userEvent.setup();
    arrange();
    await user.click(screen.getByRole('menuitem', { name: 'Settings…' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSettingsOpen).toHaveBeenCalledTimes(1);
    expect(onAboutOpen).not.toHaveBeenCalled();
    expect(onClose.mock.invocationCallOrder[0]).toBeLessThan(onSettingsOpen.mock.invocationCallOrder[0]);
  });

  it.each(['Profile Section', 'Help Section'])(
    'closes the menu when %s is clicked',
    async (marker) => {
      const user = userEvent.setup();
      arrange();
      await user.click(screen.getByText(marker));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSettingsOpen).not.toHaveBeenCalled();
    },
  );

  it('renders the sections without props', () => {
    arrange();
    expect(mockProfileMenuSection).toHaveBeenCalledWith({}, undefined);
    expect(mockHelpDocsMenuSection).toHaveBeenCalledWith({}, undefined);
  });

  it('renders the blocks in the order profile, settings, about, help', () => {
    arrange();
    const text = document.body.textContent ?? '';
    const positions = ['Profile Section', 'Settings…', 'About Smart Supply Pro', 'Help Section'].map((m) => text.indexOf(m));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});
