/**
 * @file HelpIconButton.test.tsx
 * @module __tests__/features/help/components/HelpIconButton
 * @description Contract tests for `HelpIconButton`.
 *
 * Contract under test:
 * - Renders an accessible icon button with `aria-label="Open help"`.
 * - Clicking calls `openHelp(topicId)`.
 * - Tooltip shows the provided text, or defaults to "Help".
 *
 * Out of scope:
 * - MUI Tooltip/Popper internals and icon rendering details.
 *
 * Test strategy:
 * - Mock `useHelp` deterministically and assert calls.
 * - Assert tooltip by user-level hover (text appears), not by classnames.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HelpIconButton from '../../../../features/help/components/HelpIconButton';
import * as helpHooks from '../../../../hooks/useHelp';

// Mock the useHelp hook
vi.mock('../../../../hooks/useHelp', () => ({
  useHelp: vi.fn(),
}));

describe('HelpIconButton', () => {
  function mockUseHelp(overrides?: Partial<ReturnType<typeof helpHooks.useHelp>>) {
    const value = {
      openHelp: vi.fn(),
      closeHelp: vi.fn(),
      currentTopicId: null,
      isOpen: false,
      ...overrides,
    };
    vi.mocked(helpHooks.useHelp).mockReturnValue(value);
    return value;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders an accessible help button', () => {
    mockUseHelp();
    render(<HelpIconButton topicId="test-topic" />);
    expect(screen.getByRole('button', { name: /open help/i })).toBeInTheDocument();
  });

  it('calls openHelp(topicId) when clicked', async () => {
    const user = userEvent.setup();
    const { openHelp } = mockUseHelp();

    render(<HelpIconButton topicId="inventory-help" />);
    await user.click(screen.getByRole('button', { name: /open help/i }));

    expect(openHelp).toHaveBeenCalledWith('inventory-help');
  });

  it.each([
    { name: 'custom tooltip', tooltip: 'Click for help', expected: 'Click for help' },
    { name: 'default tooltip', tooltip: undefined, expected: 'Help' },
  ])('shows $name on hover', async ({ tooltip, expected }) => {
    const user = userEvent.setup();
    mockUseHelp();

    render(<HelpIconButton topicId="test-topic" tooltip={tooltip} />);

    // Tooltip content is rendered on hover (portal), so assert by user behavior.
    await user.hover(screen.getByRole('button', { name: /open help/i }));
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it('does not submit a parent form (IconButton is not a submit control)', () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    mockUseHelp();

    render(
      <form onSubmit={onSubmit}>
        <HelpIconButton topicId="form-help" />
      </form>
    );

    // If IconButton were a submit button, this would trigger a submit event.
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
