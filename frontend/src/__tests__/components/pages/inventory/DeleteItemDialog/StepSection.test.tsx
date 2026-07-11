/**
 * @file StepSection.test.tsx
 * @module __tests__/components/pages/inventory/DeleteItemDialog/StepSection
 * @description Contract tests for StepSection.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepSection } from '../../../../../pages/inventory/dialogs/DeleteItemDialog/StepSection';

describe('StepSection', () => {
  it('renders the step number, title, and children', () => {
    render(
      <StepSection title="Select Supplier" number={1}>
        <div>child content</div>
      </StepSection>
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Select Supplier')).toBeInTheDocument();
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
