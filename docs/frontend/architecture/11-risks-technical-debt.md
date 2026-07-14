# §11 Risks & Technical Debt

Known risks (external or time-driven) and deliberately accepted debt, each
traceable to the code or decision it concerns. Internal tracking IDs match the
BUCKET markers in source.

## 11.1 Risks

| ID | Risk | Impact | Mitigation / plan |
|---|---|---|---|
| FR-01 | The serve-time API-base rewrite depends on Nginx MIME mapping (`sub_filter_types`); a base-image bump could silently disable it | Low — the retained direct cross-origin path keeps the app working; topology flips invisibly | Documented in [ADR-0008 (backend)](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md); cheap detection is checking the served bundle for the backend origin |
| FR-02 | Routes load eagerly — no code splitting; initial bundle grows with every feature | Low–Medium over time | Page-module boundaries are the ready seams ([§6](06-runtime.md)); revisit when initial-load metrics warrant |

## 11.2 Technical Debt (tracked)

| ID | Item | Where |
|---|---|---|
| CB-APP33/34 | Settings language-sync can overwrite explicit format choices; parts of the preference set lack persistence | [§8](08-concepts.md) |
| CB-APP15 / CM-APP2 | Scrollbar rules duplicated between global.css and CssBaseline; print `!important` overrides unaudited | [§8b](08b-concepts-i18n-theming.md) |

The remaining open registry entries are UI-level items of the same character and
live as BUCKET markers at their source sites.

## Size-Budget Waivers

Measured by AST against the budgets in [§2](02-constraints.md). Three files exceed
their layer's alarm; each is waived, with the reason, rather than split. No function
exceeds its layer's alarm.

| File | Code lines | Alarm | Why not split |
|---|---|---|---|
| `inventory/dialogs/PriceChangeDialog/PriceChangeForm.tsx` | 163 | 160 (dialogs) | Three lines over. A flat, single-purpose JSX form; any split would be a fragment defined by the threshold rather than by a responsibility |
| `inventory/dialogs/ItemFormDialog/useItemForm.ts` | 135 | 120 (hooks) | One responsibility — the dialog's form controller: state, supplier query, RHF wiring, two sync effects, submit, close. The separable part was already extracted (`itemFormServerErrors.ts`); what remains is coupled through form state, and lifting the effects out would mean threading six arguments into a hook that exists only to reduce a count |
| `inventory/dialogs/EditItemDialog/useEditItemForm.ts` | 124 | 120 (hooks) | Same shape and the same reasoning, four lines over |

Eight functions sit above their band but below their alarm (`PriceChangeForm` 146,
`EditItemForm` 133, `PriceTrendCard` 122, `MovementsSection` 112, `DateRangeFilter`
110, `useItemForm` 94, `useEditItemForm` 90, `usePriceChangeForm` 87). These are
accepted: the band is guidance, the alarm is the gate.
