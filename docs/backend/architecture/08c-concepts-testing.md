# §8 Cross-cutting Concepts — Testing

This page documents the testing **strategy and its rationale** — the layers, the
database choice, and what is deliberately not covered. It is not a catalogue of test
classes.

## Test layers

Tests follow a layered shape: a base of isolated unit tests, a broad middle of
single-layer slice tests, and a thin cap of full-context tests.

| Layer | Annotation | Test files | Scope |
|-------|-----------|-----------|-------|
| Unit | `@ExtendWith(MockitoExtension.class)` / `@Mock` | 27 | Services, OAuth2 handlers, `DatabaseDialectDetector`, and dialect-selection logic — no Spring context |
| Web slice | `@WebMvcTest` | 22 | Controllers, security endpoints, and the exception handler, with the service layer mocked |
| Persistence slice | `@DataJpaTest` | 10 | All repositories — including the four custom analytics `*Impl` classes — against H2 |
| Full context | `@SpringBootTest` | 2 | Application boot and wiring smoke tests |

Security paths are tested as an overlay rather than a separate layer: `@WithMockUser`,
`@WithUserDetails`, and security-context tests (10 files) cover authentication and
authorization at the controller slice and in dedicated security-config tests.

## Database strategy: H2 for tests, Oracle for production

Automated tests run against **H2 in Oracle-compatibility mode**, configured in
`application-test.yml` (`jdbc:h2:mem:ssp;MODE=Oracle;DATABASE_TO_UPPER=true`).

The reason is a concrete infrastructure constraint, not convenience. Oracle Free Tier
Autonomous Database restricts access by **IP allowlist**. Development machines (home
ISP) and CI runners have dynamic IPs and cannot reliably reach the Oracle instance,
and maintaining the allowlist per test run is impractical. H2 in Oracle-compatibility
mode gives fast, hermetic tests with no external dependency or network reachability
requirement.

What H2 covers: the schema, JPA mappings, derived queries, and the **H2 branch** of
the dialect-specific analytics SQL.

What it deliberately does not cover: the **Oracle branch** of the analytics SQL,
Oracle-specific runtime behaviour, and the wallet / mTLS connection path. These are
exercised only by the deployed application. Note the precise boundary — the dialect
*selection* logic is unit-tested (a test asserts that the Oracle profile selects the
Oracle SQL string), but the Oracle SQL's *execution* is never run in CI.

Manual Oracle verification: an `oracle-it` profile (`application-oracle-it.yml`, under
`src/test/resources`) runs a smoke test against a real Oracle ADB from a developer
machine with a locally extracted wallet and an allowlisted IP. It is explicitly **not**
intended for CI and is run by hand before significant releases — see
[oracle-it smoke-test runbook](oracle-it-smoke-test.md).

This gap is recorded as a standing risk — see [§11, R-04](./11-risks-technical-debt.md)
— and the dialect design that makes the H2/Oracle split possible is documented in
[ADR-0006](./09-decisions/adr-0006-dialect-aware-analytics-queries.md).

## Coverage

Coverage is measured by the JaCoCo Maven plugin, bound to the `verify` phase, with the
report written to `target/site/jacoco`.

## Test data

There is no shared fixture or test-data builder framework. Entities and DTOs are
constructed directly within each test, keeping test setup local and explicit.

---

See also: [§8 Concepts](./08-concepts.md) (security, validation, exception handling)
and [§8 Infrastructure](./08b-concepts-infra.md) (configuration, persistence, logging).
