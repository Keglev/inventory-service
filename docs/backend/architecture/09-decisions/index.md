[Back to Architecture Index](../index.md)

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

- [ADR-0001: Oracle Wallet auto-login for database authentication](./adr-0001-oracle-wallet-autologin.md)
- [ADR-0002: Manual mapping over MapStruct](./adr-0002-manual-mapping-over-mapstruct.md)
- [ADR-0003: DTO boundary — no entity exposure across layers](./adr-0003-dto-boundary-no-entity-exposure.md)
- [ADR-0004: HTTP status as the error envelope (no success wrapper)](./adr-0004-http-status-as-envelope.md)
- [ADR-0005: Error message sanitization in GlobalExceptionHandler](./adr-0005-error-message-sanitization.md)
- [ADR-0006: Custom repository implementations for dialect-aware analytics queries](./adr-0006-dialect-aware-analytics-queries.md)
- [ADR-0007: Cross-origin session cookie configuration for split frontend/backend deployment](./adr-0007-cross-origin-auth-cookie.md)
- [ADR-0008: Serve-time API-base rewrite and same-origin proxy](./adr-0008-serve-time-api-base-rewrite.md)
- [ADR-0009: Runtime wallet delivery via Fly secret](./adr-0009-runtime-wallet-delivery.md)
- [ADR-0010: Custom domain with a canonical `www` host](./adr-0010-custom-domain-and-canonical-host.md)
- [ADR-0011: Restrict OAuth2 login to an email allow-list](./adr-0011-restrict-oauth2-login-to-allowlist.md)

---

Frontend decisions: see [docs/frontend/architecture/adr/](../../../frontend/architecture/09-decisions/index.md)

[Back to Architecture Index](../index.md)
