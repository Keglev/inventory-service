/**
 * @file LanguageToggle.interactions.test.tsx
 * @module __tests__/app/public-shell/header/LanguageToggle.interactions
 * @description
 * Interaction tests for LanguageToggle.
 *
 * Scope:
 * - Tooltip appears on hover
 * - onToggle is fired via click and keyboard activation
 *
 * Out of scope:
 * - i18next integration / persistence side effects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LanguageToggle from '../../../../app/public-shell/header/LanguageToggle';

// Static asset stubs (Vite import paths)
vi.mock('/flags/de.svg', () => ({ default: 'de-flag.svg' }));
vi.mock('/flags/us.svg', () => ({ default: 'us-flag.svg' }));

type Props = React.ComponentProps<typeof LanguageToggle>;

describe('LanguageToggle (interactions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderToggle(props: Partial<Props> = {}) {
    const merged: Props = {
      locale: 'de',
      onToggle: vi.fn(),
      tooltip: 'Toggle language',
      ...props,
    };
    return render(<LanguageToggle {...merged} />);
  }

  it('shows the provided tooltip text on hover', async () => {
    // Ensures the tooltip is wired to the IconButton hover interaction.
    const user = userEvent.setup();
    renderToggle({ tooltip: 'Change to English' });

    await user.hover(screen.getByRole('button'));

    expect(await screen.findByText('Change to English')).toBeInTheDocument();
  });

  it('updates tooltip text when the tooltip prop changes', async () => {
    // Guards against stale props affecting overlay content.
    const user = userEvent.setup();
    const { rerender } = renderToggle({ locale: 'de', tooltip: 'Switch to English' });

    await user.hover(screen.getByRole('button'));
    expect(await screen.findByText('Switch to English')).toBeInTheDocument();

    rerender(<LanguageToggle locale="en" onToggle={vi.fn()} tooltip="Switch to Deutsch" />);

    // Ensure the tooltip updates; unhover/hover helps MUI tooltip re-evaluate content.
    await user.unhover(screen.getByRole('button'));
    await user.hover(screen.getByRole('button'));

    expect(await screen.findByText('Switch to Deutsch')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', async () => {
    // Primary behavior: user click triggers toggle callback.
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderToggle({ onToggle });

    await user.click(screen.getByRole('button'));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onToggle on repeated clicks', async () => {
    // Ensures the component remains responsive across multiple interactions.
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderToggle({ onToggle });

    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(button);

    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('is keyboard accessible (Enter triggers onToggle)', async () => {
    // Accessibility: keyboard activation should behave like click.
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderToggle({ onToggle });

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
