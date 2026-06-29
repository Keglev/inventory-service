/**
 * @file DeleteItemContent.tsx
 * @module pages/inventory/dialogs/DeleteItemDialog/DeleteItemContent
 *
 * @summary
 * Pure router between the form view and the confirmation view, driven by
 * the showConfirmation flag from the orchestrator hook.
 *
 * @enterprise
 * - Single decision point. Both views receive the same state object, so
 *   the router carries no business logic and no local state.
 * - Mirrors the two-dialog architecture in DeleteItemDialog.tsx: each
 *   Dialog instance mounts this component with the appropriate
 *   showConfirmation value.
 */

import { DeleteFormView } from './DeleteFormView';
import { DeleteConfirmationView } from './DeleteConfirmationView';
import type { DeleteItemContentProps } from './DeleteItemDialog.types';

export type { DeleteItemContentProps };

export function DeleteItemContent({
  state,
  showConfirmation,
}: DeleteItemContentProps) {
  return (
    /* 
      Route based on showConfirmation state
      - false: render form view (supplier -> item -> reason -> preview)
      - true: render confirmation view (warning + review)
    */
    showConfirmation ? (
      <DeleteConfirmationView state={state} />
    ) : (
      <DeleteFormView state={state} />
    )
  );
}
