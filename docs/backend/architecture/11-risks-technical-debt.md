# Risks and Technical Debt

Known risks and accepted technical debt, with impact and a mitigation or planned
resolution. Items are grouped as **risks** (external or time-driven exposure) and
**technical debt** (internal shortcuts accepted deliberately). Each is traceable to
the code or decision it concerns.

## 11.1 Risks

| ID | Risk | Impact | Likelihood | Mitigation / plan |
|------|------|--------|------------|-------------------|
| R-01 | The test suite pins H2 to 2.5.252 because the Boot-4.1-managed H2 2.4.240 rejects Hibernate 7 converter-generated CHECK constraints (h2database issue #4323; measured 2026-10-15: 38 errors across the 14 `@DataJpaTest` classes on 2.4.240, 0 on 2.5.252). The pin diverges from the Boot-managed version. | Low — test-only dependency; production runs Oracle | Low | Remove the pin once the Boot BOM manages H2 2.5 or later |
| R-02 | The wallet is held as a base64 value in the host environment file and exists extracted on the running container's filesystem; the trust boundary is the host's file protections and the live machine rather than the image. | Low–Medium — requires host or live-machine compromise; the encrypted wallet additionally needs `ORACLE_WALLET_PASSWORD`, and ADB still enforces network/credential checks | Low | Accepted; see [ADR-0009](./09-decisions/adr-0009-runtime-wallet-delivery.md) (the former image-extraction risk is retired — the image carries no wallet) |
| R-03 | `sanitize()` is regex- and order-based; a novel internal detail matching no pattern can pass through into an error body. | Low–Medium — information disclosure | Low | Known gap documented in [ADR-0005](./09-decisions/adr-0005-error-message-sanitization.md); extend patterns as new leak shapes appear |
| R-04 | Oracle Free Tier ADB restricts access by IP allowlist; dev and CI environments have dynamic IPs and cannot reach it. All automated tests therefore run against H2 (Oracle-compatibility mode); no integration test exercises Oracle before deployment. | An Oracle-specific defect (SQL dialect divergence in the analytics queries) can surface only in production. | Low–Medium | Keep H2 and Oracle SQL variants paired in StockMetricsSqlBuilder (ADR-0006); smoke-test analytics endpoints post-deploy; consider a manual Oracle-reachable test run before major releases ([runbook](oracle-it-smoke-test.md)). |

## 11.2 Technical Debt

| ID | Item | Impact | Resolution |
|------|------|--------|------------|
| TD-01 | `createdAt` is set four different ways across entities: the service before the first save (InventoryItem), `@PrePersist` (StockHistory), `@CreationTimestamp` (Supplier), field initializer (AppUser). | Low — inconsistent audit semantics, harder to reason about | Standardise on one mechanism |
| TD-02 | `handleDataIntegrity` Javadoc states it sanitizes SQL detail, but it returns a hardcoded conflict message and never calls `sanitize()`. | Trivial — misleading documentation | Correct the comment to match behaviour |
| TD-03 | No optimistic locking (`@Version`) anywhere; concurrent updates to the same row last-write-wins. | Low — acceptable for current single-writer workload | Accepted; revisit if concurrent edit volume grows |
| TD-05 | Docs UI: double scrollbars on documentation pages. | Low — cosmetic | Fix in the docs cleanup pass |
| TD-07 | `DatabaseDialectDetector` selects SQL dialect from the active Spring profile, not from the real datasource. An H2 datasource without a `test` or `h2` profile active silently produces Oracle SQL that fails at query execution rather than at startup. | Low — misconfiguration surfaces as a runtime query error, not a clear startup failure | Consider validating dialect against actual connection metadata, or failing fast on a profile/datasource mismatch |

## 11.3 Size-Budget Waivers

Measured over code lines against the budgets in [§2](02-constraints.md). One
method exceeds its alarm and is waived below, with the same reason stated at the
site in the code. No method reaches the 50 hard cap and no file
reaches the 300 hard cap.

| Waived | Measured | Alarm | Reason |
|------|------|--------|------------|
| `SecurityConfig::securityFilterChain` | 32 | 30 | One fluent `HttpSecurity` statement. The parts that can be extracted already are, into the entry-point, filter and authorization helpers. The 32nd line names the frontend login page, which switches off the login and logout pages Spring generates (2026-10-28). |

Three files sit above their target and below their alarm and are watched rather
than waived, all against the repository target of 80:
`StockHistoryRepository.java` at 85,
`repository/custom/StockDetailQueryRepositoryImpl.java` at 100 and
`repository/custom/util/StockTrendSqlBuilder.java` at 145. The repository was at
115 until the stock-history read API and its three queries were removed
(2026-10-28). The builder was waived at 153 until its unused all-suppliers
monthly variant was removed (2026-10-16).

Seven methods sit between the target of 20 and the alarm of 30:
`EmployeeAnalyticsService::getEmployeeActivity` at 27, the two daily-movement
builders in `StockTrendSqlBuilder` at 23 each, `UserProvisioningService::provision`
at 22, and `StockValueSeries::build`, `StockHistoryValidator::validate` and
`StockDetailQueryRepositoryImpl::streamEventsForWAC` at 21 each. These figures
follow the counting rule in [§2](02-constraints.md), which leaves both brace
lines out (2026-10-29); the earlier count of thirteen included them. The two
daily-movement builders joined the band when they replaced the daily-valuation
builders, which had been waived above. The band is guidance, the alarm is the
gate.
