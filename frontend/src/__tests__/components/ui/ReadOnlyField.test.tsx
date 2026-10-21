/**
 * @file ReadOnlyField.test.tsx
 * @module __tests__/components/ui/ReadOnlyField
 * @description Contract tests for the read-only value panel shared by the
 * inventory and supplier edit dialogs.
 *
 * Contract under test:
 * - Renders the label, then the value, in document order.
 * - Renders the hint below the value only when one is given.
 *
 * Out of scope:
 * - Panel styling (pixel-compared against the old markup in the FO5 PR).
 */

import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import ReadOnlyField from '@/components/ui/ReadOnlyField';

describe('ReadOnlyField', () => {
  it('renders the label before the value', () => {
    const { container } = render(<ReadOnlyField label="Name" value="Bearing 6204" />);

    expect(container.textContent).toBe('NameBearing 6204');
  });

  it('renders the hint after the value when one is given', () => {
    const { container } = render(
      <ReadOnlyField label="Name" value="ACME" hint="The name cannot be changed" />,
    );

    expect(screen.getByText('The name cannot be changed')).toBeInTheDocument();
    expect(container.textContent).toBe('NameACMEThe name cannot be changed');
  });

  it('renders no hint element when the hint is omitted', () => {
    const { container } = render(<ReadOnlyField label="Name" value="ACME" />);

    // Label and value only: an empty caption would still add vertical space.
    expect(container.firstElementChild?.children).toHaveLength(2);
  });
});
