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
| CB-APP99 | Hardcoded hex colors in supplier delete dialogs pending theme-token migration | [§8b](08b-concepts-i18n-theming.md) |
| CB-APP100 | Supplier form hooks classify errors by free-text matching instead of the structured envelope | [§8](08-concepts.md) |
| CB-APP15 / CM-APP2 | Scrollbar rules duplicated between global.css and CssBaseline; print `!important` overrides unaudited | [§8b](08b-concepts-i18n-theming.md) |
| ST-APP29 | Help-icon pattern duplicated across four dialogs; shared extraction queued | [§5.2](05-domains/suppliers.md) |
| ST-APP30 | Twelve form/state hooks exceed the 50-code-line function cap; case-by-case review deferred | [§2](02-constraints.md) |

The remaining open registry entries are UI-level items of the same character and
live as BUCKET markers at their source sites.
