# ADR-0018: Endpoints without callers are removed after a measured access-log window

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-10-28

## Context
Code reviews found endpoints that no part of the frontend calls: the stock-history
read API, a POST twin of the stock-update query, an authorities lookup, an API
logout, a full-replace item update, two supplier reads and an unpaged item list.
The project's removal rule says that no caller in code is not proof of disuse: an
endpoint may serve scripts, operators, a second client or a troubleshooting habit.
It counts as unused only when code, tests, docs, scripts, workflows, operations
and access logs all show no caller. The first five sources were checked; the API
host kept no access log, so the last one was missing.

Forces:
- Every public endpoint is attack surface and a contract to keep documented,
  tested and secured. Several of these were open to anonymous demo callers.
- Removing a documented endpoint is a breaking change for any caller we do not
  know about. The evidence has to cover real traffic, not only our own clients.
- A request log holds personal data (addresses, browser strings). Collecting it
  needs a purpose, a short life and filters that keep out what the measurement
  does not need.

## Decision
Measure first, then remove. A temporary access log on the API host recorded
every request to `api.smartsupplypro.de` for a window of about two weeks; an
aggregation script turned it into counts per endpoint and client class; the
endpoints with no real caller were removed; the log was removed afterwards.

### Method
- **Log** (Caddy site block, maintenance-assistant repository, 2026-10-12): JSON
  lines; IPv4 addresses masked to /16; Referer, redirect `Location` and the OAuth
  callback's `code` and `state` deleted; Cookie, Set-Cookie and Authorization
  redacted by Caddy's defaults. Rolled at 10 MiB, kept at most 336 hours.
- **Window**: 2026-10-12 08:38 UTC to 2026-10-28 19:46 UTC (16.5 days), four
  files, nothing aged out. Every browser call reaches this host, because the
  frontend proxies `/api` same-origin (ADR-0008), so one log covers all clients.
- **Aggregation**: `ops/epa/epa-aggregate.sh`, run inside the Caddy container.
  It prints counts only; no address, query string or User-Agent text leaves the
  host. Path segments holding a digit collapse to `{id}`. Calibrated beforehand on
  `caddy:2.10-alpine` with planted lines (every class, a query string, an OAuth
  callback, an empty directory). The runbook is `ops/epa/README.md`.
- **Classes** by User-Agent: browser 6,825, headless 9,388 (our own probes and
  test runs), curl 852, bot 284, other 203, script 123. 17,675 lines, 0 unparsed.
  6,134 requests fell outside the application prefixes: scanners probing `.env`,
  `.git`, `wp-*` and credential files. 6,132 were answered with a redirect or an
  error; two got 200 (one GET, one CORS preflight).

### Result for the candidates (all classes, whole window)

| Endpoint | Requests | Removed by |
|---|---|---|
| `GET /api/stock-history`, `/item/{id}`, `/reason/{r}` | 0 | #436 |
| `GET /api/stock-history/search` | 1 (our curl probe, 401) | #436 |
| `POST /api/analytics/stock-updates/query` | 0 | #437 |
| `GET /api/me/authorities` | 0 | #437 |
| `POST /api/auth/logout` | 0 | #435 |
| `PUT /api/inventory/{id}` | 0 | #438 |
| `GET /api/suppliers/{id}` | 0 | #438 |
| `GET /api/suppliers/search` | 0 | #438 |
| `GET /api/inventory` (unpaged) | 2 (our curl probes, 10-12) | #439 |

For comparison, the paths the frontend does use: `POST /logout` 50,
`GET /api/analytics/stock-updates` 114, `GET /api/inventory/search` 217.

The same log answered two questions about the security rules (#434):
`/health/**` was public with no controller behind it (one request, 404), and
`GET /login` served Spring's generated sign-in page (17 browser requests). The
public rules for `/health/**` and `/login/**` were dropped, and naming the frontend
login page in the OAuth2 configuration switched the generated login and logout
pages off.

Kept although they saw no request in the window, because the frontend calls
them: `DELETE /api/inventory/{id}`, `POST /api/suppliers`,
`PATCH /api/inventory/{id}/name`. A window without a call proves nothing about an
endpoint with a caller.

### The log itself
The log was removed after the measurement (maintenance-assistant change, then
`/data/access-logs` deleted on the host). The privacy page stays as it is: it
covers the providers' own server logs, and the operator's log no longer exists.

## Alternatives Considered
- **Keep every endpoint.** Rejected: the removal rule is satisfied for each one,
  and keeping them means keeping their tests, docs and security rules for no
  caller. Several were readable without a sign-in in demo mode.
- **Remove them on code evidence alone.** Rejected: the rule exists because
  callers outside the code are invisible to a code search.
- **Keep the access log permanently, as security monitoring.** Rejected: nothing
  reads it, so it would collect personal data without a use; it would need a
  paragraph on the privacy page and a retention policy; and the scanner traffic
  it showed was already answered by redirects and errors. If monitoring is wanted later, it is a decision of its
  own, with its own purpose and retention.

## Consequences
- The removals are breaking API changes for unknown callers. The window makes
  such a caller unlikely, not impossible; the version of the next release says so.
- The OpenAPI reference goes from 41 to 30 operations (measured on main before
  the removals and on all six removal branches merged together).
- The measurement can be repeated: turn the log on with the block in the runbook,
  run the script, turn it off. The runbook shows one synthetic input line and its
  output; no real log line is published.
- The log carried no roles, so the role rule on the employee analytics (admin or
  demo, not user) is still open; it needs another kind of evidence.
- Record correction found while publishing the script: the copy run on
  2026-10-28 printed `ERROR` but exited 0 when no line parsed, because the check
  exits inside a pipeline. The repository copy sets `pipefail`. That run parsed
  every line, so its result stands.

## References
- Runbook and script: `ops/epa/README.md`, `ops/epa/epa-aggregate.sh`
- [ADR-0008: Serve-time API-base rewrite and same-origin proxy](adr-0008-serve-time-api-base-rewrite.md)
- [ADR-0012: Backend hosting on the shared Hetzner host](adr-0012-backend-hosting-on-shared-hetzner-host.md)
- Frontend ADR-0014 (bounded lists searched in the browser), amended 2026-10-28
