# ADR-0011: Gating the frontend image on the HTTP contract it serves

[Back to Decisions Index (ADRs)](index.md)

## Status
Accepted

## Date
2026-09-18

## Context
The Playwright suite ([ADR-0009](adr-0009-end-to-end-testing-with-playwright.md))
runs the production bundle under `vite preview`, which serves `dist/` directly.
The artifact users receive is not that: it is an Nginx image built from
`ops/nginx/default.conf`, and every serve-time behaviour in that file was
executed by nothing the repository ran.

Some of it was already proven after deploy
([ADR-0010](adr-0010-verifying-frontend-deploys.md)): `health-check.sh` reaches
`/api/health` through the proxy location, and `verify-served-bundle.sh` proves
the serve-time rewrite ran in the bundle the edge serves. The rest was proven
nowhere. The SPA fallback, the 404 on a missing asset, the caching headers, and
the four security headers were established only by the config being read.

The security headers are the sharpest case. `add_header` does not accumulate
across levels, so a location that declares one drops every header inherited from
above. `default.conf` therefore repeats the same four headers in each of its
three file-serving locations, and its own comment records that the three copies
must stay in sync. Nothing checked that they did. A location added without its
copy serves them missing, silently, and no test in the repository would notice.

## Decision
A curl-based gate, `.github/scripts/verify-image-contract.sh`, runs in
`5-frontend-ci.yml` against the image that job has just built and started. It
runs `nginx -t` inside the container, then asserts over HTTP:

1. `/`, `/index.html` and a deep link each return 200 with `Cache-Control:
   no-cache`, which is the SPA fallback serving the shell.
2. A missing file under `/assets/` returns 404 rather than the shell.
3. The content-hashed entry bundle, discovered from the served `index.html`
   rather than named, returns 200 with `max-age=31536000` and `immutable`.
4. All four security headers are present on every one of those responses, which
   is what holds the three copies in sync.

The gate proves it can fail before it is trusted, on every run rather than once
at review time. `--selftest` puts a wrong status, an absent header and a present
header carrying the wrong value through the same three comparisons and exits 1
unless all three are reported. No check runs inside a pipeline, because a failure
count incremented on the right-hand side of a pipe lands in a subshell and is
lost.

The proxy locations are excluded. They `proxy_pass` to the production backend, so
exercising them from CI would put CI traffic on production, and `/api/` is proven
after deploy instead. The serve-time rewrite is excluded for a different reason:
it substitutes against `$host`, which is `127.0.0.1` in CI and the real host in
production, so the CI result would not describe the deployed behaviour.

## Alternatives Considered
- **A second Playwright project against the image.** It would render the SPA
  fallback rather than inferring it from a status and a content type. Every other
  assertion here is a status, a header or a body match, so the browser buys one
  assertion and costs a browser run and a second `baseURL` in a config whose
  current one is load-bearing.
- **Post-deploy only, extending ADR-0010's scripts.** It would test the true
  artifact behind the real edge. It also reports after the image is live, and the
  failures this gate is built for, a dropped header or a broken fallback, are
  exactly the ones that should not reach production first.
- **`nginx -t` alone.** It proves the config parses. Every defect described above
  parses.
- **A stub backend so the proxy locations can be exercised.** A stub proves the
  proxy reaches the stub. The failure worth catching there is a mismatch with the
  real backend, which a stub is guaranteed not to have.

## Consequences
- A dropped security header, a broken SPA fallback, an asset 404 turned into an
  HTML response, or a caching regression fails the pull request rather than
  reaching the edge.
- The job needs a running container. It already builds one and lints the
  Dockerfile with docker, so no new capability enters CI.
- The gate cannot be reproduced on a workstation without docker. A failure has to
  be read from the job log, which is why every assertion names what it expected
  and what it got.
- `5-frontend-ci.yml` triggers on the gate script as well as on `frontend/**` and
  `ops/nginx/**`, so a change to the gate runs the gate.
- The expected values were measured against the deployed image, not read off the
  config, so the gate asserts what production does rather than what the file
  appears to say.
- One known oddity is deliberately not asserted: a 404 under `/assets/` carries
  `public, immutable` with no `max-age`, because `expires` does not fire on a 404
  while `add_header ... always` does. It is untidy rather than harmful.
- No timing figure is recorded here. The step's cost has not been measured; if it
  matters later it belongs in a dated amendment, as ADR-0009 carries.
