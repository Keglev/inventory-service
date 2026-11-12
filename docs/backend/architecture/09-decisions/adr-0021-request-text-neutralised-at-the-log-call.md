# ADR-0021: Request text is neutralised where it enters a log line

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-11-12

## Context
A value an attacker controls and the application writes into a log can carry a
line break. The next log reader then sees a line the application never wrote, or a
real line split in two (log injection, CWE-117).

The backend writes plain-text Logback lines to standard output. On the Hetzner
host Docker keeps them in its `json-file` driver (10 MB, three files), and they are
read with `docker logs`; nothing ships them to a log store or parses them
(ADR-0012). The application itself logs little: seven classes hold a logger, with
eleven log calls between them (measured on `main` 2026-11-12). Three of those calls
carry text from the request:

- the OAuth2 failure handler (`OAuth2Config`) logs the failure, whose error code and
  description can come from the callback's query string;
- the authorization-request repository logs a rejected `return` origin from the
  query string;
- the login success handler logs a rejected return URL from the return cookie.

A fourth call, the database health check, logs the driver's exception message.

Each of these passes its value through `LogSanitizer`, a helper written for this
purpose: control characters, NEL and the Unicode line and paragraph separators
become `_`, and the value is cut at 500 characters with a marker. The decision
recorded here is whether that per-call helper stays the mechanism, or whether
neutralisation moves into the log format, where it would cover every line.

## Decision
Request-derived text is neutralised at the call that logs it, with `LogSanitizer`.
The log format stays plain text.

Rules for every log call in the backend:

- A value that can come from a request (parameter, header, cookie, body, or an
  exception message built from one) goes through `LogSanitizer.sanitize` before it
  reaches the logger.
- Accounts are named by their id, never by e-mail address or name: the privacy page
  lists no personal data in application logs.
- Cookies, tokens, the OAuth2 authorization request and credentials are never
  logged, sanitized or not.
- A failure is logged as its exception type and a sanitized message; the request
  that caused it is not echoed.

## Alternatives Considered
- **Structured (JSON) logging** (`logging.structured.format.console`). The JSON
  encoder escapes control characters in every field, so framework lines and stack
  traces would be covered too, and `LogSanitizer` would keep only the length cap.
  Rejected for now: nothing reads the logs as JSON, the only reader is a person
  running `docker logs`, for whom one JSON object per line is harder to read, and a
  stack trace becomes one escaped string. It is the right move once the logs feed a
  tool that parses them.
- **A Logback pattern that rewrites the message** (`%replace(%msg){...}`). One
  regular expression over every line, with no change to the format. Rejected: it
  covers the message but not the exception text Logback prints after it, it cannot
  bound the length, and a pattern buried in configuration is easy to lose when the
  pattern is next changed.
- **Neither: rely on Tomcat rejecting CR and LF in the request line.** That holds
  for the path, not for decoded parameters, cookies or a provider's error text,
  which is exactly what the three calls log.

## Consequences
- Every line the application writes from request text stays one line, at most 500
  characters of value plus the marker.
- The rule is enforced by review, not by a tool: a new log call that carries request
  text and skips `LogSanitizer` writes it raw. The rules above are what a reviewer
  checks.
- Lines written by the framework are not neutralised, and neither is the stack trace
  `GlobalExceptionHandler` logs for an unhandled exception. A forged line there needs
  an exception message built from request text that reaches the generic handler;
  the framework rejections the handler knows are answered without logging. This gap
  is accepted while the only reader is a person, and is the reason to revisit this
  record (structured logging) when a log pipeline is added.
- `LogSanitizer` lives in the `security` package beside its callers and has its own
  unit tests; the cap and the replacement character are part of its contract.

## Implementation Notes
- Helper: `src/main/java/com/smartsupplypro/inventory/security/LogSanitizer.java`
  (`sanitize`, `MAX_LENGTH`, `TRUNCATED`), tests in `LogSanitizerTest`.
- Callers: `OAuth2Config` (failure handler), `CookieOAuth2AuthorizationRequestRepository`
  (rejected return origin), `OAuth2LoginSuccessHandler` (rejected return URL),
  `HealthCheckController` (driver message).
- Account ids instead of e-mail addresses: `UserProvisioningService`.
- Log levels and profiles: section 8, infrastructure concepts (Logging).

## References
- [ADR-0012: Backend hosting on the shared Hetzner host](adr-0012-backend-hosting-on-shared-hetzner-host.md)
- [ADR-0005: Error message sanitization in GlobalExceptionHandler](adr-0005-error-message-sanitization.md): the
  same concern for response bodies
- Section 8, infrastructure concepts (`../08b-concepts-infra.md`)
- CWE-117, Improper Output Neutralization for Logs: https://cwe.mitre.org/data/definitions/117.html
- System-wide decisions index (`../../../decisions/index.md`)

---

[Back to Architecture Index](../index.md)
