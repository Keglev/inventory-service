# Architecture Decisions

Every architecture decision in this system, backend and frontend, in one place.

An ADR records **why** a design was chosen, which alternatives were rejected and
for what reason, and what the choice costs. It does not describe how a component
works; that is the job of the architecture documents around it.

The records themselves live inside each tier's arc42 documentation, in section 9,
next to the sections that reference them. This page is an index over both, so the
whole set is reachable from one place without moving any record out of the
document it belongs to.

Numbering is per tier and never reused within a tier, so the same number can
appear in both columns below. A reference from outside a tier names the tier:
backend ADR-0004 is the error envelope, frontend ADR-0004 is the dialog
workflow.

## Backend

Source: [Backend architecture, section 9](../backend/architecture/09-decisions/index.md)

| # | Decision |
|---|---|
| 0001 | [Oracle Wallet auto-login for database authentication](../backend/architecture/09-decisions/adr-0001-oracle-wallet-autologin.md) |
| 0002 | [Manual mapping over MapStruct](../backend/architecture/09-decisions/adr-0002-manual-mapping-over-mapstruct.md) |
| 0003 | [DTO boundary — no entity exposure across layers](../backend/architecture/09-decisions/adr-0003-dto-boundary-no-entity-exposure.md) |
| 0004 | [HTTP status as the error envelope (no success wrapper)](../backend/architecture/09-decisions/adr-0004-http-status-as-envelope.md) |
| 0005 | [Error message sanitization in GlobalExceptionHandler](../backend/architecture/09-decisions/adr-0005-error-message-sanitization.md) |
| 0006 | [Custom repository implementations for dialect-aware analytics queries](../backend/architecture/09-decisions/adr-0006-dialect-aware-analytics-queries.md) |
| 0007 | [Cross-origin session cookie configuration for split frontend/backend deployment](../backend/architecture/09-decisions/adr-0007-cross-origin-auth-cookie.md) |
| 0008 | [Serve-time API-base rewrite and same-origin proxy](../backend/architecture/09-decisions/adr-0008-serve-time-api-base-rewrite.md) |
| 0009 | [Runtime wallet delivery via Fly secret](../backend/architecture/09-decisions/adr-0009-runtime-wallet-delivery.md) |
| 0010 | [Custom domain with a canonical `www` host](../backend/architecture/09-decisions/adr-0010-custom-domain-and-canonical-host.md) |
| 0011 | [Restrict OAuth2 login to an email allow-list](../backend/architecture/09-decisions/adr-0011-restrict-oauth2-login-to-allowlist.md) |
| 0012 | [Backend hosting on the shared Hetzner host](../backend/architecture/09-decisions/adr-0012-backend-hosting-on-shared-hetzner-host.md) |
| 0013 | [The docs pipeline rebuilds, and publishes, by change](../backend/architecture/09-decisions/adr-0013-docs-pipeline-rebuilds-by-change.md) |

Backend ADR-0009 supersedes the wallet delivery and password model of backend
ADR-0001; the auto-login mechanism ADR-0001 chose still stands.

## Frontend

Source: [Frontend architecture, section 9](../frontend/architecture/09-decisions/index.md)

| # | Decision |
|---|---|
| 0001 | [Frontend folder structure strategy (App Shell + Pages + API + Cross-cutting)](../frontend/architecture/09-decisions/adr-0001-frontend-folder-structure-strategy.md) |
| 0002 | [API layer abstraction with shared httpClient and domain modules](../frontend/architecture/09-decisions/adr-0002-api-layer-abstraction-httpclient-and-domain-modules.md) |
| 0003 | [Page model and domain separation (Inventory/Suppliers/Analytics)](../frontend/architecture/09-decisions/adr-0003-page-model-and-domain-separation.md) |
| 0004 | [Dialog/workflow architecture (Dialog folders + orchestration pattern)](../frontend/architecture/09-decisions/adr-0004-dialog-workflow-architecture.md) |
| 0005 | [Application shell split: authenticated shell vs public shell](../frontend/architecture/09-decisions/adr-0005-shell-split-authenticated-vs-public.md) |
| 0006 | [Global state approach using Context modules (Auth/Settings/Toast/Help)](../frontend/architecture/09-decisions/adr-0006-global-state-with-context-modules.md) |
| 0007 | [i18n strategy and language/region settings integration](../frontend/architecture/09-decisions/adr-0007-i18n-strategy-and-language-region-settings.md) |
| 0008 | [Testing structure and taxonomy under src/__tests__](../frontend/architecture/09-decisions/adr-0008-testing-structure-and-taxonomy.md) |
| 0009 | [End-to-end testing with Playwright against a local demo stack](../frontend/architecture/09-decisions/adr-0009-end-to-end-testing-with-playwright.md) |
| 0010 | [Verifying a frontend deploy against the bytes the browser receives](../frontend/architecture/09-decisions/adr-0010-verifying-frontend-deploys.md) |
