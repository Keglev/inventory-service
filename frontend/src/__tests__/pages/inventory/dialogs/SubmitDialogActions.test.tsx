/**
 * @file SubmitDialogActions.test.tsx
 * @module __tests__/pages/inventory/dialogs/SubmitDialogActions
 * @testing Unit tests for the inventory dialog action row.
 * @description
 * Contract under test:
 * - Cancel and submit call their handlers.
 * - While submitting, both buttons are disabled and a spinner covers submit.
 * - An extra disable rule blocks submit only.
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tEn } from '@/__tests__/test/i18nEn';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => tEn(key) }),
}));

const { SubmitDialogActions } = await import('@/pages/inventory/dialogs/SubmitDialogActions');

function setup(props: Partial<Parameters<typeof SubmitDialogActions>[0]> = {}) {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();
  render(
    <SubmitDialogActions
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitting={false}
      submitLabel="Apply"
      submitTestId="apply"
      {...props}
    />,
  );
  return { onCancel, onSubmit };
}

describe('SubmitDialogActions', () => {
  it('calls the cancel and submit handlers', async () => {
    const { onCancel, onSubmit } = setup();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByTestId('apply'));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons and shows a spinner when submitting', () => {
    setup({ submitting: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByTestId('apply')).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('disables only submit when the extra rule says so', () => {
    setup({ submitDisabled: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(screen.getByTestId('apply')).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
