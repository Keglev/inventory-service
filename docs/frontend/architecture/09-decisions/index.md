[⬅️ Back to Frontend Architecture Index](../index.md)

- [Back to Overview (English)](../overview.md)
- [Zurück zum Überblick (Deutsch)](../overview-de.md)

# Architecture Decision Records (ADRs)

This directory contains **architecture decisions with justification**.

ADRs answer:
- **Why** we chose a design (and why not alternatives)
- what tradeoffs we accept
- where the decision is implemented (high-level pointers)

ADRs do **not** document:
- how a component works internally
- step-by-step implementation details

## Index

- [ADR-0001: Frontend folder structure strategy (App Shell + Pages + API + Cross-cutting)](./adr-0001-frontend-folder-structure-strategy.md)
- [ADR-0002: API layer abstraction with shared httpClient and domain modules](./adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md)
- [ADR-0003: Page model and domain separation (Inventory/Suppliers/Analytics)](./adr-0003-page-model-and-domain-separation.md)
- [ADR-0004: Dialog/workflow architecture (Dialog folders + orchestration pattern)](./adr-0004-dialog-workflow-architecture.md)
- [ADR-0005: Application shell split: authenticated shell vs public shell](./adr-0005-shell-split-authenticated-vs-public.md)
- [ADR-0006: Global state approach using Context modules (Auth/Settings/Toast/Help)](./adr-0006-global-state-with-context-modules.md)
- [ADR-0007: i18n strategy and language/region settings integration](./adr-0007-i18n-strategy-and-language-region-settings.md)
- [ADR-0008: Testing structure and taxonomy under src/__tests__](./adr-0008-testing-structure-and-taxonomy.md)

---

[⬅️ Back to Frontend Architecture Index](../index.md)
