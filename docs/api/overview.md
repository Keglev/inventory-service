## Inventory Service API — Overview

Version: 1.0.0

This overview provides a concise reference for the Inventory Service API intended for quick onboarding and for linking into ReDoc pages.

1. Overview Layer
- Title & Version: Inventory Service API v1.0
- Description: Enterprise inventory management REST API for SmartSupplyPro. Provides inventory CRUD, supplier management, analytics, and health endpoints.
- Contact: api-support@smartsupplypro.com
- License: See project LICENSE (if present)
- Servers:
  - https://inventoryservice.fly.dev/api (production)
  - http://localhost:8081 (development)

2. Security Layer (summary)
- Authentication: Google OAuth2 / OIDC and session cookie for API usage (see OpenAPI securitySchemes and architecture/patterns)
- Authorization: Role-based (ROLE_USER, ROLE_ADMIN). Scopes: openid, email, profile (OIDC) and cookie-based session for API clients.

3. Controller (Endpoint) Layer (summary)
- Key domains: Inventory, Suppliers, Analytics, Health, Authentication
- Example endpoints:
  - GET /api/inventory
  - POST /api/inventory
  - GET /api/inventory/{id}
  - PATCH /api/inventory/{id}/quantity

4. DTO & Model Layer
- Schemas live under `docs/api/openapi/components/schemas` and are exposed in the OpenAPI spec under `components.schemas`.

5. Validation Layer
- Uses annotation-based validation documented in the code and represented in OpenAPI request schemas (e.g., required fields on InventoryItemDTO).

6. Notes & Next Steps
- This file is intentionally concise — it exists to be the first documentation item to generate an HTML page for the API Overview. The next tasks will be: create a Security summary page, Controller index, DTO index (schemas), and a Validation page.

---

For the full interactive API reference, use the ReDoc page: /api/redoc/api.html
