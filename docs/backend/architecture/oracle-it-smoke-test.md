# Runbook: Manual Oracle smoke test (`oracle-it` profile)

[← Back to §8c Testing Concepts](08c-concepts-testing.md)

Operational procedure for verifying that the application boots and authenticates
against the real Oracle Autonomous Database before a significant release. This is a
**manual** check run from a developer machine; it is intentionally excluded from CI
(see [§8 Testing](08c-concepts-testing.md) for the rationale and
[§11, R-04](11-risks-technical-debt.md) for the gap it partially closes).

## What it does

Runs a single Spring Boot context-load test (`InventoryServiceApplicationTest.contextLoads()`)
under the `oracle-it` profile. If the application context assembles and the datasource
connects, the test passes — confirming the wallet, credentials, and Oracle dialect work
end to end against a live ADB. It does **not** exercise the analytics SQL or business
flows; it is a connection and boot smoke test.

## Safety property

The `oracle-it` profile activates **only** when `ENABLE_WALLET_TEST=true`. Without that
flag the profile resolver falls back to the standard `test` profile (H2), so this can
never accidentally contact Oracle in CI or a normal local build.

## Prerequisites

1. **Oracle wallet extracted locally.** Download the wallet for the ADB instance and
   unzip it to a local directory (the directory containing `tnsnames.ora`,
   `cwallet.sso`, `sqlnet.ora`).
2. **Your public IP allowlisted.** Oracle Free Tier ADB restricts access by IP. In the
   Oracle Cloud console, add your current public IP to the instance's access control
   list. (Home ISPs rotate IPs, so re-check this each time.)
3. **A reachable TNS alias.** Note the alias from `tnsnames.ora` you will use in `DB_URL`.

## Environment variables (all four required)

The profile resolver validates these before the Spring context starts; any missing one
aborts with an `IllegalStateException`.

| Variable | Value |
|----------|-------|
| `ENABLE_WALLET_TEST` | `true` — the activation flag |
| `TNS_ADMIN` | Absolute path to the extracted wallet directory (read by the Oracle driver from the OS environment) |
| `DB_URL` | JDBC URL using the TNS alias, e.g. `jdbc:oracle:thin:@<alias>` |
| `DB_USER` | Oracle schema user |
| `DB_PASS` | Oracle schema password |

`TNS_ADMIN` must be exported in the shell **before** launching the JVM — the driver
resolves the wallet from the process environment, not from `application-oracle-it.yml`.

## Steps (PowerShell)

```powershell
# 1. Confirm your current public IP is allowlisted in the Oracle console first.

# 2. Export the environment for this shell session
$env:ENABLE_WALLET_TEST = "true"
$env:TNS_ADMIN = "C:\path\to\extracted\wallet"
$env:DB_URL    = "jdbc:oracle:thin:@your_tns_alias"
$env:DB_USER   = "your_schema_user"
$env:DB_PASS   = "your_schema_password"

# 3. Run only the context-load test under the oracle-it profile
mvn test "-Dtest=InventoryServiceApplicationTest" "-DenableWalletTest=true"
```

`-DenableWalletTest=true` and `ENABLE_WALLET_TEST=true` are equivalent triggers; setting
either is sufficient. Both are shown for clarity.

## Interpreting the result

- **`contextLoads()` passes** → the app boots, the wallet/mTLS connection succeeds, and
  the Oracle dialect initialises. Connection path verified.
- **`IllegalStateException` before tests run** → a required env var is unset. Re-check the
  four variables above.
- **Connection/timeout failure** → almost always the IP allowlist (your IP changed) or a
  wrong `DB_URL` alias / `TNS_ADMIN` path.

## After the test

Remove your IP from the allowlist if you added it temporarily, and clear the session
variables (close the shell, or set them to empty). The wallet directory holds live
credentials — keep it outside the repository.
