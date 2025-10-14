# Authentication

This guide explains how clients authenticate with SmartSupplyPro APIs.

- Primary method: OAuth2 with Google Identity Provider.
- Use the `/api/v1/auth/login` endpoint to start the flow.
- For machine-to-machine or service integrations, use short-lived API keys or service accounts where supported (see the security architecture docs under `../../architecture/patterns/`).

Example: initiating OAuth2 login

```bash
curl -X GET "http://localhost:8081/api/v1/auth/login"
```

For more details, see `redoc/index.html` (interactive API reference) and the architecture-level OAuth2 pattern documentation.

## Authentication: Quick reference

This project uses Google OAuth2 (authorization-code flow) and establishes a server-side session for browser and programmatic clients. Key endpoints and behaviors (from the backend implementation):

- Initiate browser login (Spring Security): GET /oauth2/authorization/google
- OAuth2 callback (Spring default pattern): /login/oauth2/code/{registrationId}  (e.g. /login/oauth2/code/google)
- API session/profile endpoint: GET /api/me  — returns current user's profile (email, fullName, role, pictureUrl)
- API authorities: GET /api/me/authorities — returns authority strings
- API logout (programmatic): POST /api/auth/logout — invalidates session and expires cookies

The server-side success handler (`OAuth2LoginSuccessHandler`) performs automatic user provisioning and redirects the browser to a configured frontend landing URL. It also supports a short-lived return cookie named `SSP_RETURN` that allows a one-time post-login redirect to an allow-listed origin.

## Sequence diagram (authorization code + session creation)

```mermaid
sequenceDiagram
	participant C as Client (Browser)
	participant B as Backend (SmartSupplyPro)
	participant G as Google OAuth2
	participant F as Frontend App

	C->>B: GET /oauth2/authorization/google
	B->>G: redirect user to Google's authorization URL
	G->>C: User authenticates and Google redirects to /login/oauth2/code/google with code
	C->>B: GET /login/oauth2/code/google?code=... (callback)
	B->>G: Exchange code for tokens (server-side)
	B->>B: Provision AppUser if not exists; create server session
	B->>C: Set cookies (JSESSIONID, SESSION) SameSite=None; Secure
	B->>C: Redirect to configured frontend landing URL (or SSP_RETURN target)
	C->>F: Frontend reads session via GET /api/me
	F->>B: GET /api/me (with cookies)
	B-->>F: 200 OK + profile JSON
```

## Examples

Note: the browser flow normally performs redirects — curl can be used to simulate calls after a session has been established (for testing). The client must send cookies created by the backend (`JSESSIONID` / `SESSION`).

### Curl (login redirect and calling protected endpoint)

1) Open login in a browser (this initiates Google OAuth2):

```bash
# Browser redirect (not useful via curl, but demonstrates the endpoint)
curl -v "http://localhost:8081/oauth2/authorization/google"
```

2) After completing the login in your browser, call the profile endpoint using the saved cookie jar:

```bash
# After browser login, export cookies from the browser or use a cookie jar saved by a prior curl session
curl -v --cookie cookies.txt "http://localhost:8081/api/me"
```

3) Logout via API (programmatic clients):

```bash
curl -v -X POST --cookie cookies.txt --cookie-jar cookies.txt "http://localhost:8081/api/auth/logout"
```

### TypeScript (fetch) — call protected endpoint using browser session cookie

```ts
// Browser context: credentials: 'include' ensures cookies are sent across origins
async function fetchProfile() {
	const resp = await fetch('/api/me', {
		method: 'GET',
		credentials: 'include',
		headers: { 'Accept': 'application/json' }
	});
	if (!resp.ok) throw new Error('Not authenticated');
	return resp.json();
}

// Logout
async function apiLogout() {
	await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}
```

You can also reuse a small example file bundled with the docs: `guides/examples/auth-fetch.ts`.

### Java (Spring WebClient) — call protected endpoint using server-side cookie

```java
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.http.HttpHeaders;

WebClient client = WebClient.builder()
		.baseUrl("http://localhost:8081")
		// If you have the session cookie value, include it explicitly. Example:
		.defaultHeader(HttpHeaders.COOKIE, "JSESSIONID=<value>; SESSION=<value>")
		.build();

String profileJson = client.get()
		.uri("/api/me")
		.retrieve()
		.bodyToMono(String.class)
		.block();

System.out.println(profileJson);
```

Tip: in server-to-server integration tests you can create an OAuth2AuthenticationToken programmatically (see the test helpers under `src/test/java/...`) to avoid real OAuth2 redirects.

## Important notes (server behavior)

- Cookie attributes: the backend sets `JSESSIONID` and `SESSION` with `SameSite=None` and `Secure=true` to support cross-site frontends. The `AuthController` explicitly expires these cookies on `POST /api/auth/logout`.
- Return redirects: the backend stores an optional `SSP_RETURN` cookie (set by the frontend) to enable a one-time allowed redirect after login; the server clears this cookie after use.
- Allowed origins: redirects are validated against an allowlist (configured via `AppProperties`) to avoid open-redirect vulnerabilities.
- Session policy: session creation policy is `IF_REQUIRED` and the application uses cookie-based sessions.

## Additional references

- `OAuth2LoginSuccessHandler` (backend): `src/main/java/com/smartsupplypro/inventory/security/OAuth2LoginSuccessHandler.java`
- Controller endpoints: `AuthController` (`/api/me`, `/api/me/authorities`, `/api/auth/logout`)
- Architecture-level OAuth2 details: `docs/architecture/patterns/oauth2-security-architecture.md`

If you'd like, I can now commit this expanded guide and run the HTML link checker. I can also generate a small integration test snippet that programmatically builds an OAuth2AuthenticationToken for tests (like existing test helpers) — tell me which you'd prefer next.