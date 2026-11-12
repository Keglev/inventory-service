# §8 Cross-cutting Concepts — Testing

This page documents the testing **strategy and its rationale** — the layers, the
database choice, and what is deliberately not covered. It is not a catalogue of test
classes.

## Test layers

Tests follow a layered shape: a base of isolated unit tests, a broad middle of
single-layer slice tests, and a thin cap of full-context tests.

| Layer | Annotation | Scope |
|-------|-----------|-------|
| Unit | `@ExtendWith(MockitoExtension.class)` / `@Mock` | Services, validators, OAuth2 handlers, `DatabaseDialectDetector` and the dialect selection — no Spring context |
| Web slice | `@WebMvcTest` | Controllers, the security rules in front of them and the global exception handler, with the service layer mocked |
| Persistence slice | `@DataJpaTest` | All repositories, the custom analytics `*Impl` classes included, against H2 |
| Full context | `@SpringBootTest` | Application boot, the actuator build information, and item reads outside a transaction (open-in-view is off) |

Security paths are tested as an overlay rather than a separate layer: `@WithMockUser`,
`@WithAnonymousUser` and security-context tests cover authentication and authorization at
the controller slice and in dedicated security-config tests. `ApiAuthorizationContractTest`
fails when an `/api` handler carries no authorization rule.

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
report written to `target/site/jacoco`. A `check` execution fails the build when the
bundle's branch coverage falls below the floor set in `pom.xml`; the comment there says
why branch coverage on the whole bundle is the measure. The report of the latest build on
`main` is published with the docs:
[backend coverage report](https://keglev.github.io/inventory-service/backend/coverage/index.html).

## Test data

Most tests build their entities and DTOs directly, so a test's setup stays next to its
assertions. Where several test classes need the same objects, a fixtures class beside
them holds the builders (`InventoryItemServiceImplFixtures`,
`InventoryItemControllerTestFixtures`); the `testsupport` package holds `LogCapture`,
which tests use to assert on what one class logs.

---

See also: [§8 Concepts](./08-concepts.md) (security, validation, exception handling)
and [§8 Infrastructure](./08b-concepts-infra.md) (configuration, persistence, logging).
