# §11 Risks and Technical Debt

Known risks and accepted technical debt, with mitigation or planned resolution.

> DRAFT rows below are the verified deferred items — refine wording, severity, and
> add/remove during the §11 authoring pass.

| ID | Item | Type | Impact | Mitigation / plan |
|------|------|------|--------|-------------------|
| TD-01 | `sanitize()` is regex/order-based; a novel internal detail matching no pattern passes through unsanitized | Debt | Low–Med (info disclosure) | Documented gap (ADR-0005); extend patterns as new leak shapes appear |
| TD-02 | `createdAt` set three different ways across entities (`@PrePersist`, `@CreationTimestamp`, field initializer) | Debt | Low | Standardize on one mechanism |
| TD-03 | `handleDataIntegrity` Javadoc says it sanitizes SQL, but it returns a hardcoded message | Debt (docs) | Trivial | Fix the comment to match behaviour |
| R-01 | Spring Boot 3.5.x approaching OSS end-of-support | Risk | Security/support | Upgrade to 4.x (deferred — verify exact EOL date when authoring) |
| TD-04 | Docs build: Lua filter `gsub("^api/","")` rule unverified | Debt (build) | Low | Review during docs pass |
| TD-05 | Docs UI: double scrollbars on doc pages; JaCoCo "back to docs" link | Debt (docs UI) | Low | Fix in reference/cleanup pass |
