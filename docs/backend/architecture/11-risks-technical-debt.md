# Risks and Technical Debt

Known risks and accepted technical debt, with impact and a mitigation or planned
resolution. Items are grouped as **risks** (external or time-driven exposure) and
**technical debt** (internal shortcuts accepted deliberately). Each is traceable to
the code or decision it concerns.

## 11.1 Risks

| ID | Risk | Impact | Likelihood | Mitigation / plan |
|------|------|--------|------------|-------------------|
| R-01 | Spring Boot 3.5.x reaches **OSS end-of-support on 2026-06-30**; after that no security patches reach Maven Central. The app is pinned to 3.5.15 (last free patch). | Rising, unpatched CVE exposure across the Spring portfolio (Framework 6.2, Security) over time | High over time; nil at runtime on the cutoff date | Upgrade to 4.x (deferred — an 83-breaking-change migration raising the baseline to JUnit 6 / Jackson 3). Interim: stay on 3.5.15, watch CVE advisories. Source: spring.io/support-policy |
| R-02 | Oracle wallet is embedded in the Docker image; an attacker who extracts the image obtains `cwallet.sso`. | Medium — wallet alone is insufficient without network access to ADB and the schema credentials | Low | Documented residual risk in [ADR-0001](./09-decisions/adr-0001-oracle-wallet-autologin.md); ADB still enforces network/credential checks |
| R-03 | `sanitize()` is regex- and order-based; a novel internal detail matching no pattern can pass through into an error body. | Low–Medium — information disclosure | Low | Known gap documented in [ADR-0005](./09-decisions/adr-0005-error-message-sanitization.md); extend patterns as new leak shapes appear |
| R-04 | Oracle Free Tier ADB restricts access by IP allowlist; dev and CI environments have dynamic IPs and cannot reach it. All automated tests therefore run against H2 (Oracle-compatibility mode); no integration test exercises Oracle before deployment. | An Oracle-specific defect (SQL dialect divergence in the analytics queries) can surface only in production. | Low–Medium | Keep H2 and Oracle SQL variants paired in StockMetricsSqlBuilder (ADR-0006); smoke-test analytics endpoints post-deploy; consider a manual Oracle-reachable test run before major releases ([runbook](oracle-it-smoke-test.md)). |

## 11.2 Technical Debt

| ID | Item | Impact | Resolution |
|------|------|--------|------------|
| TD-01 | `createdAt` is set three different ways across entities: `@PrePersist` (InventoryItem, StockHistory), `@CreationTimestamp` (Supplier), field initializer (AppUser). | Low — inconsistent audit semantics, harder to reason about | Standardise on one mechanism |
| TD-02 | `handleDataIntegrity` Javadoc states it sanitizes SQL detail, but it returns a hardcoded conflict message and never calls `sanitize()`. | Trivial — misleading documentation | Correct the comment to match behaviour |
| TD-03 | No optimistic locking (`@Version`) anywhere; concurrent updates to the same row last-write-wins. | Low — acceptable for current single-writer workload | Accepted; revisit if concurrent edit volume grows |
| TD-04 | Docs build: Lua filter rule `gsub("^api/","")` is unverified and possibly incorrect. | Low — affects generated doc links only | Review during the reference/cleanup pass |
| TD-05 | Docs UI: double scrollbars on documentation pages; JaCoCo report "back to docs" link is broken. | Low — cosmetic / navigation | Fix in the reference/cleanup pass |
| TD-06 | Legacy duplicate doc trees (`layers/` vs flat `controller/`, `model/`, `repository/`, ...) and the typo file `dto-converson-inbound.md` coexist. | Low — reader confusion, stale content | Resolve in the reference/cleanup pass; delete the non-`adr-` ADR stubs (`0001`–`0004`) once migration is confirmed |
| TD-07 | `DatabaseDialectDetector` selects SQL dialect from the active Spring profile, not from the real datasource. An H2 datasource without a `test` or `h2` profile active silently produces Oracle SQL that fails at query execution rather than at startup. | Low — misconfiguration surfaces as a runtime query error, not a clear startup failure | Consider validating dialect against actual connection metadata, or failing fast on a profile/datasource mismatch |
