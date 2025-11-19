[⬅️ Back to Architecture Index](../index.html)

# Layers Architecture Index

This directory contains comprehensive documentation of the five-layer architecture used in Smart Supply Pro's backend system.

## Available Sections

### Core Layers Documentation

1. **[Controller Layer](./controller/index.html)** - HTTP API entry point, request routing, authorization
2. **[Service Layer](./service-layer.html)** - Business logic orchestration, transaction management
3. **[Repository Layer](./repository-layer.html)** - Data access abstraction, queries, persistence
4. **[Model Layer](./model-layer.html)** - JPA entities, relationships, domain objects
5. **[Infrastructure & Cross-Cutting Concerns](./infrastructure/index.html)** - Configuration, security, validation, exception handling, mapping

### Controller Components (Detailed)

The Controller Layer has been broken down into focused guides:

- **[Routing](./controller/routing.md)** - URL mapping and HTTP methods
- **[Validation](./controller/validation.md)** - Input validation and constraints
- **[Authorization](./controller/authorization.md)** - Authentication and role checks
- **[DTO Conversion (Inbound)](./controller/dto-conversion-inbound.md)** - JSON → Object mapping
- **[DTO Conversion (Outbound)](./controller/dto-conversion-outbound.md)** - Object → JSON mapping
- **[Response Building](./controller/response-building.md)** - HTTP status codes and responses
- **[Core Controllers](./controller/core-controllers.md)** - SupplierController, InventoryItemController, etc.
- **[Error Handling Flow](./controller/error-handling-flow.md)** - Exception mapping to HTTP responses
- **[Best Practices](./controller/best-practices.md)** - Standards and guidelines
- **[Request/Response Lifecycle](./controller/lifecycle.md)** - Complete flow through the layer
- **[Integration](./controller/integration.md)** - How controller connects to service layer
- **[Testing](./controller/testing.md)** - Unit and integration testing strategies

## Quick Navigation by Role

### Developers
- Start with [Overview](./overview.html) for the big picture
- Review [Controller Layer](./controller/index.html) to understand endpoint structure
- Check [Routing](./controller/routing.md) for endpoint mapping
- Check [Service](./service-layer.html) for business logic patterns
- Reference [Best Practices](./controller/best-practices.md) for standards

### Database Administrators
- Review [Repository Layer](./repository-layer.html) for queries and indexing
- Check [Model Layer](./model-layer.html) for schema and relationships
- Reference [Exception Handling](./infrastructure/exception-handling.md) for error scenarios

### Security/DevOps
- Review [Security](./infrastructure/security.md) for authentication details
- Check [Configuration](./infrastructure/configuration.md) for environment setup
- Reference [Best Practices](./infrastructure/best-practices.md) for standards

### New Team Members
- Start with [Overview](./overview.html)
- Read [Best Practices](./infrastructure/best-practices.md)
- Review specific layers as needed

---

[⬅️ Back to Architecture Index](../index.html)
