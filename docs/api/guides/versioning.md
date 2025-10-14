# Versioning

The SmartSupplyPro API uses a path-based versioning scheme.

- Current stable prefix: `/api/v1/`
- New major versions will appear as `/api/v2/` with migration notes in the changelog and release notes.
- Backwards-incompatible changes will be communicated in `https://github.com/Keglev/inventory-service/releases`.

Best practices:

- Clients should negotiate via Accept headers when possible and use stable clients pinned to a major version.
- Use `Prefer` headers for opt-in features where supported.