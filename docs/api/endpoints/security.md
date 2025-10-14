# Security API Endpoints

This page summarizes the security-related API endpoints exposed by the Inventory Service. It is intended as an API-level reference for consumers (clients) and integration engineers.

## Summary
- Authentication via OAuth2 (Google) for browser logins.
- Session-based authentication for client requests using secure cookies.

---

## Endpoints

### GET /api/me
Returns the current authenticated user's profile.
- Response: 200 OK
- Authentication: session cookie (JSESSIONID / SESSION), credentials include

### GET /api/me/authorities
Returns array of authority/role strings for the current user.
- Response: 200 OK
- Authentication: session cookie

### POST /api/auth/logout
Invalidate session and clear authentication cookies.
- Response: 204 No Content (or 200 with message depending on server configuration)
- Behavior: clears `JSESSIONID` and `SESSION` cookies with SameSite=None; Secure flags

### OAuth2 / Browser login
- Initiate login: GET /oauth2/authorization/google
- Callback handled by Spring Security at /login/oauth2/code/{registrationId}
- On success the server sets session cookies and may set `SSP_RETURN` cookie to redirect the browser back to the application.

---

## Notes for implementers
- Cookies are set with `Secure; HttpOnly; SameSite=None` to support cross-site login flows where required.
- If embedding API calls from cross-origin frontends, ensure `credentials: 'include'` is used and CORS is configured on the server.

---

(Placeholder) Further details and concrete request/response examples will be added programmatically from OpenAPI schemas in a follow-up pass.
