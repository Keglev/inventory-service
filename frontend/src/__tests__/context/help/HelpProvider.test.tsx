/**
 * @file HelpProvider.test.tsx
 * @module __tests__/context/help/HelpProvider
 * @description Contract tests for the `HelpProvider` global help state manager.
 *
 * Contract under test:
 * - Renders children and exposes help state via context.
 * - `openHelp(topicId)` opens help and sets the current topic.
 * - `closeHelp()` closes help immediately but clears the topic after the animation delay.
 *
 * Out of scope:
 * - Help content rendering and topic registry.
 * - Visual animation details beyond the delayed topic clear.
 *
 * Test strategy:
 * - Use a probe component to drive context actions through user interactions.
 * - Use fake timers only where the provider explicitly uses `setTimeout`.
 * - Assert behavior (open/closed + topic) rather than implementation details.
 */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelpContext } from '../../../context/help/HelpContext';
import { HelpProvider } from '../../../context/help/HelpContext';

function HelpProbe() {
  const ctx = React.useContext(HelpContext);

  if (!ctx) {
    return <div data-testid="help-probe">missing-provider</div>;
  }

  return (
    <div data-testid="help-probe">
      <div data-testid="is-open">{String(ctx.isOpen)}</div>
      <div data-testid="topic">{ctx.currentTopicId ?? ''}</div>
      <button type="button" onClick={() => ctx.openHelp('topic-1')}>
        open
      </button>
      <button type="button" onClick={ctx.closeHelp}>
        close
      </button>
    </div>
  );
}

function renderHelp(ui?: React.ReactNode) {
  return render(<HelpProvider>{ui ?? <HelpProbe />}</HelpProvider>);
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('HelpProvider', () => {
  it('renders children', () => {
    renderHelp(<div data-testid="child">child</div>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('openHelp(topicId) opens help and sets topic', async () => {
    const user = userEvent.setup();
    renderHelp();

    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    expect(screen.getByTestId('topic')).toHaveTextContent('');

    await user.click(screen.getByRole('button', { name: 'open' }));

    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('topic')).toHaveTextContent('topic-1');
  });

  it('closeHelp() closes immediately and clears topic after the animation delay', async () => {
    vi.useFakeTimers();
    renderHelp();

    fireEvent.click(screen.getByRole('button', { name: 'open' }));
    expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    expect(screen.getByTestId('topic')).toHaveTextContent('topic-1');

    fireEvent.click(screen.getByRole('button', { name: 'close' }));

    // Close is immediate.
    expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    // Topic is kept briefly to allow a fade-out animation.
    expect(screen.getByTestId('topic')).toHaveTextContent('topic-1');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(screen.getByTestId('topic')).toHaveTextContent('');
  });

});
