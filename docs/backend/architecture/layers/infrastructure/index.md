[⬅️ Back to Layers Overview](../overview.html)

# Infrastructure & Cross-Cutting Concerns Layer

The **Infrastructure Layer** provides foundational services and handles cross-cutting concerns that span multiple layers. These include configuration, security, validation, exception handling, and data mapping.

**Location:** `src/main/java/com/smartsupplypro/inventory/`
- `config/` - Configuration classes
- `security/` - OAuth2 and authentication handlers
- `validation/` - Custom validators
- `exception/` - Exception handling and custom exceptions
- `mapper/` - Data mapping utilities

## Quick Navigation

### By Topic
- **[Configuration](./configuration.md)** - Spring beans, properties, application settings
- **[Security](./security.md)** - OAuth2, authentication, authorization
- **[Exception Handling](./exception-handling.md)** - Global error mapping, error responses
- **[Validation](./validation.md)** - Custom validators, validation flow
- **[Data Mapping](./mapping.md)** - Entity ↔ DTO transformation, MapStruct
- **[Best Practices](./best-practices.md)** - Industry standards, common patterns

### By Role
- **Developers** → Start with [Configuration](./configuration.md) to understand Spring setup
- **Security Team** → Review [Security](./security.md) for authentication/authorization details
- **QA/Testing** → Check [Validation](./validation.md) and [Exception Handling](./exception-handling.md)
- **DevOps** → Refer to [Configuration](./configuration.md) for environment setup
- **New Team Members** → Begin with [Best Practices](./best-practices.md) for standards

## Architecture Overview

The Infrastructure Layer supports all other layers by providing cross-cutting concerns:

```
┌─────────────────────────────────────────────────────────┐
│              Controller Layer (HTTP)                     │
├─────────────────────────────────────────────────────────┤
│              Service Layer (Business Logic)              │
├─────────────────────────────────────────────────────────┤
│            Repository Layer (Data Access)                │
├─────────────────────────────────────────────────────────┤
│          Domain Model Layer (Entities & DTOs)            │
├─────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (Cross-Cutting Concerns)          │
│  ┌──────────┬──────────┬──────────┬──────────┬────────┐ │
│  │Security  │Validation│Exception │Mapping   │Config  │ │
│  └──────────┴──────────┴──────────┴──────────┴────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Key Responsibilities

1. **Configuration** - Spring beans, environment-specific settings
2. **Security** - OAuth2, authentication filters, authorization checks
3. **Exception Handling** - Centralized error mapping to HTTP responses
4. **Validation** - Custom business rule validators
5. **Data Mapping** - DTO ↔ Entity transformation
6. **Best Practices** - Standards for infrastructure concerns

---

[⬅️ Back to Layers Overview](../overview.html)
