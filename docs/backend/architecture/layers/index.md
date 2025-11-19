[⬅️ Back to Architecture Index](../index.html)

# Layers Architecture Index

This directory contains comprehensive documentation of the five-layer architecture used in Smart Supply Pro's backend system.

## Available Sections

### Core Layers Documentation

1. **[Controller Layer](./controller/index.html)** - HTTP API entry point, request routing, authorization
2. **[Service Layer](./service/index.html)** - Business logic orchestration, transaction management
3. **[Repository Layer](./repository-layer.html)** - Data access abstraction, queries, persistence
4. **[Model Layer](./model/index.html)** - JPA entities, relationships, domain objects
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

### Service Components (Detailed)

The Service Layer has been broken down into focused guides:

- **[Core Services Overview](./service/index.html)** - SupplierService, InventoryItemService, StockHistoryService, AnalyticsService
- **[Supplier Service](./service/supplier-service.md)** - Supplier management operations
- **[Inventory Item Service](./service/inventory-item-service.md)** - Item lifecycle and stock tracking
- **[Stock History Service](./service/stock-history-service.md)** - Immutable audit trail management
- **[Analytics Service](./service/analytics-service.md)** - Business intelligence and reporting
- **[Service Patterns](./service/service-patterns.md)** - Dependency injection, transactions, validation
- **[Dependency Injection](./service/dependency-injection.md)** - Constructor-based DI pattern
- **[Transaction Management](./service/transaction-management.md)** - @Transactional boundaries
- **[Exception Translation](./service/exception-translation.md)** - Domain exceptions → HTTP responses
- **[Data Transformation](./service/dto-transformation.md)** - DTO ↔ Entity mapping
- **[Validation Strategy](./service/validation-strategy.md)** - Business rule validation
- **[Audit Logging](./service/audit-logging.md)** - Tracking changes with createdBy/updatedBy
- **[Interaction Diagram](./service/interaction-diagram.md)** - Service operation flow
- **[Cross-Cutting Concerns](./service/cross-cutting-concerns.md)** - Exception handling and logging
- **[Testing](./service/testing.md)** - Unit testing with Mockito
- **[Integration](./service/integration.md)** - How service layer connects to others
- **[Best Practices](./service/best-practices.md)** - Service design guidelines

### Model Components (Detailed)

The Model Layer has been broken down into focused guides:

- **[Supplier Entity](./model/supplier-entity.md)** - Inventory goods providers
- **[Inventory Item Entity](./model/inventory-item-entity.md)** - Products/items in inventory
- **[Stock History Entity](./model/stock-history-entity.md)** - Immutable audit trail
- **[App User Entity](./model/app-user-entity.md)** - OAuth2 users and authentication
- **[Enumerations](./model/enums.md)** - Role and StockChangeReason types
- **[Entity Relationships](./model/relationships.md)** - Supplier → Item → StockHistory, User relationships
- **[JPA Annotations](./model/jpa-annotations.md)** - @Entity, @Column, @ManyToOne, @Version, etc.
- **[Design Patterns](./model/design-patterns.md)** - Audit fields, optimistic locking, denormalization
- **[Data Integrity](./model/data-integrity.md)** - Primary keys, unique constraints, foreign keys
- **[Model Lifecycle](./model/lifecycle.md)** - Transient → Managed → Persistent states
- **[Best Practices](./model/best-practices.md)** - Lombok, fetch strategies, immutability

## Quick Navigation by Role

### Developers
- Start with [Overview](./overview.html) for the big picture
- Review [Controller Layer](./controller/index.html) to understand endpoint structure
- Check [Routing](./controller/routing.md) for endpoint mapping
- Check [Service Layer](./service/index.html) for business logic patterns
- Check [Service Patterns](./service/service-patterns.md) for design patterns
- Reference [Best Practices](./controller/best-practices.md) for standards

### Database Administrators
- Review [Repository Layer](./repository-layer.html) for queries and indexing
- Check [Model Layer](./model/index.html) to understand entities and relationships
- Review [Entity Relationships](./model/relationships.md) for schema design
- Reference [Data Integrity](./model/data-integrity.md) for constraints
- Check [Service Layer](./service/index.html) for transaction patterns

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
