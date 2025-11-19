[⬅️ Back to Architecture Index](../index.html)

# Layers Architecture Index

This directory contains comprehensive documentation of the five-layer architecture used in Smart Supply Pro's backend system.

## Available Sections

### Core Layers Documentation

1. **[Controller Layer](./controller-layer.html)** - HTTP API entry point, request routing, authorization
2. **[Service Layer](./service-layer.html)** - Business logic orchestration, transaction management
3. **[Repository Layer](./repository-layer.html)** - Data access abstraction, queries, persistence
4. **[Model Layer](./model-layer.html)** - JPA entities, relationships, domain objects
5. **[Infrastructure & Cross-Cutting Concerns](./infrastructure/index.html)** - Configuration, security, validation, exception handling, mapping

### Infrastructure Components (Detailed)

The Infrastructure Layer has been broken down into focused guides:

- **[Configuration](./infrastructure/configuration.md)** - Spring beans and property setup
- **[Security](./infrastructure/security.md)** - OAuth2 and authorization
- **[Exception Handling](./infrastructure/exception-handling.md)** - Error mapping and responses
- **[Validation](./infrastructure/validation.md)** - Input validation and business rules
- **[Data Mapping](./infrastructure/mapping.md)** - DTO ↔ Entity transformation
- **[Best Practices](./infrastructure/best-practices.md)** - Standards and guidelines

## Quick Navigation by Role

### Developers
- Start with [Overview](./overview.html) for the big picture
- Review [Controller](./controller-layer.html) to understand endpoint structure
- Check [Service](./service-layer.html) for business logic patterns
- Reference [Infrastructure Best Practices](./infrastructure/best-practices.md) for standards

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
