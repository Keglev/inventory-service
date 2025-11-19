[⬅️ Back to Layers Overview](../overview.html)

# Controller Layer

The **Controller Layer** serves as the HTTP API entry point for all client requests. It handles request routing, validation, authentication/authorization checks, and response formatting.

**Location:** `src/main/java/com/smartsupplypro/inventory/controller/`

**Responsibility:** HTTP protocol handling, request validation, response building, error mapping

## Quick Navigation

### By Topic
- **[Routing](./routing.md)** - URL mapping and HTTP methods
- **[Validation](./validation.md)** - Input validation and constraints
- **[Authorization](./authorization.md)** - Authentication and role checks
- **[DTO Conversion (Inbound)](./dto-conversion-inbound.md)** - JSON → Object mapping
- **[DTO Conversion (Outbound)](./dto-conversion-outbound.md)** - Object → JSON mapping
- **[Response Building](./response-building.md)** - HTTP status codes and responses
- **[Core Controllers](./core-controllers.md)** - SupplierController, InventoryItemController, etc.
- **[Error Handling Flow](./error-handling-flow.md)** - Exception mapping to HTTP responses
- **[Best Practices](./best-practices.md)** - Standards and guidelines
- **[Request/Response Lifecycle](./lifecycle.md)** - Complete flow through the layer
- **[Integration](./integration.md)** - How controller connects to service layer
- **[Testing](./testing.md)** - Unit and integration testing strategies

### By Role
- **API Developers** → Start with [Routing](./routing.md) → [Core Controllers](./core-controllers.md)
- **Security Engineers** → Review [Authorization](./authorization.md)
- **QA/Testing** → Check [Testing](./testing.md) and [Validation](./validation.md)
- **New Team Members** → Begin with [Best Practices](./best-practices.md)

## Architecture Overview

```mermaid
graph TB
    Client["Client<br/>REST Requests"]
    Routes["Request Routing<br/>@GetMapping, @PostMapping, etc."]
    Auth["Authorization<br/>@PreAuthorize"]
    Validation["Request Validation<br/>@Valid, @NotNull"]
    Mapping["DTO Conversion<br/>Request → Internal"]
    Service["Service Layer<br/>Business Logic"]
    DTOResp["DTO Conversion<br/>Domain → Response"]
    Response["HTTP Response<br/>JSON Serialization"]

    Client -->|HTTP| Routes
    Routes --> Auth
    Auth -->|Check Roles| Validation
    Validation -->|Validate DTO| Mapping
    Mapping -->|Convert| Service
    Service -->|Execute Business Logic| DTOResp
    DTOResp -->|Convert| Response
    Response -->|JSON| Client

    style Client fill:#e3f2fd
    style Routes fill:#bbdefb
    style Auth fill:#90caf9
    style Validation fill:#64b5f6
    style Mapping fill:#42a5f5
    style Service fill:#2196f3
    style DTOResp fill:#1976d2
    style Response fill:#1565c0
```

---

[⬅️ Back to Layers Overview](../overview.html)
