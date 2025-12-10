/**
 * DeleteItemContent - Router between form and confirmation views
 *
 * Responsibility: Select which view to render based on showConfirmation state
 * Purpose: Single responsibility - delegation to specialized view components
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
      - false: render form view (supplier → item → reason → preview)
      - true: render confirmation view (warning + review)
    */
    showConfirmation ? (
      <DeleteConfirmationView state={state} />
    ) : (
      <DeleteFormView state={state} />
    )
  );
}
