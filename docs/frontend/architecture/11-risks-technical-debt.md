# §11 Risks & Technical Debt

Known risks (external or time-driven) and deliberately accepted debt, each
traceable to the code or decision it concerns.

## 11.1 Risks

| ID | Risk | Impact | Mitigation / plan |
|---|---|---|---|
| FR-01 | The serve-time API-base rewrite applies only to responses whose type is listed in `sub_filter_types`; if the serving layer stops using such a type, the rewrite no-ops in silence | Low — the retained direct cross-origin path keeps the app working; topology flips invisibly | `sub_filter_types` lists both JavaScript types, and every deploy asserts the rewrite ran ([ADR-0010](09-decisions/adr-0010-verifying-frontend-deploys.md)). A base-image bump is not a cause: nginx has mapped `.js` to `application/javascript` since 1.5.4 — see the correction in [ADR-0008 (backend)](../../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md) |
| FR-02 | Routes load eagerly — no code splitting; initial bundle grows with every feature | Low–Medium over time | Page-module boundaries are the ready seams ([§6](06-runtime.md)); revisit when initial-load metrics warrant |

## 11.2 Technical Debt

No technical debt is open in the frontend. Format preferences survive a language
change and are persisted with the rest of the preference set
(`context/settings/SettingsContext.tsx`); scrollbar styling has one home,
`styles/global.css`, whose print rules state why they need `!important`.

## Size-Budget Waivers

Measured over code lines against the budgets in [§2](02-constraints.md); function
lengths follow its counting rule, which leaves both brace lines out.
A file's layer follows its place in the tree: files under a `dialogs/` folder are
dialogs, `use*` files and `handlers/` are hooks and handlers, a page's top-level
file under `pages/<area>/` is a page orchestrator, and the remaining UI files are
components.

No file carries a waiver, and no file and no function exceeds its layer's alarm.

Three functions sit above their band and below their alarm: `DateRangeFilter`
122 and `MovementsSection` 120 (components, band 100), and `useEditItemForm` 89
(hooks, band 80). `PriceChangeForm` 113, `EditItemForm` 102, `PriceTrendCard` 82,
`usePriceChangeForm` 79 and `EmployeesActivityChart` 71 are inside their bands. The band is guidance, the alarm is the gate.

Files above their band and below their alarm are watched:

| File (under `src/`) | Layer (band / alarm) | Code lines |
|---|---|---|
| `pages/analytics/components/filters/DateRangeFilter.tsx` | components (100 / 150) | 140 |
| `pages/analytics/sections/MovementsSection.tsx` | components | 140 |
| `app/settings/sections/LanguageRegionSettingsSection.tsx` | components | 130 |
| `pages/analytics/blocks/LowStockTable.tsx` | components | 128 |
| `pages/dashboard/blocks/LowStockMini.tsx` | components | 125 |
| `components/help/HelpPanel.tsx` | components | 125 |
| `components/search/ListSearchField.tsx` | components | 119 |
| `pages/analytics/blocks/StockValuePerSupplierPie.tsx` | components | 117 |
| `pages/analytics/sections/EmployeesActivityChart.tsx` | components | 111 |
| `app/layout/AppShell.tsx` | components | 102 |
| `pages/inventory/dialogs/PriceChangeDialog/PriceChangeForm.tsx` | dialogs (120 / 160) | 134 |
| `pages/inventory/dialogs/EditItemDialog/EditItemForm.tsx` | dialogs | 122 |
| `pages/inventory/dialogs/ItemFormDialog/useItemForm.ts` | hooks (80 / 120) | 120 |
| `pages/inventory/dialogs/EditItemDialog/useEditItemForm.ts` | hooks | 118 |
| `pages/inventory/dialogs/PriceChangeDialog/usePriceChangeForm.ts` | hooks | 107 |
| `pages/inventory/dialogs/QuantityAdjustDialog/useQuantityAdjustForm.ts` | hooks | 103 |
| `pages/suppliers/dialogs/EditSupplierDialog/useEditSupplierForm.ts` | hooks | 103 |
| `pages/inventory/hooks/useInventoryColumns.ts` | hooks | 88 |
| `pages/suppliers/dialogs/DeleteSupplierDialog/useDeleteSupplierForm.ts` | hooks | 88 |
| `pages/inventory/hooks/useInventoryPageData.ts` | hooks | 81 |

`useItemForm.ts` sits on its alarm: one more code line makes it a finding. The
pie's pinned readout and its wide and narrow layouts (C7) belong to the pie they
position.

Three spec files sit above their band and below their alarm:
`__tests__/pages/analytics/blocks/PriceTrendCard.test.tsx` at 378 (component and
page specs, band 350, alarm 450), and `__tests__/api/suppliers/supplierMutations.test.ts`
at 173 and `__tests__/api/analytics/updates.test.ts` at 166 (service specs, band
150, alarm 200). The PriceTrendCard spec is the largest in the tree.
