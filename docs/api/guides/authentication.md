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