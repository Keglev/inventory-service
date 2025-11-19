[⬅️ Back to Layers Overview](./index.md)

# Service Layer Patterns

The service layer uses consistent design patterns to ensure maintainability, testability, and reliability across all service implementations.

## Pattern Overview

Services follow six core patterns:

1. **Dependency Injection** - Constructor-based, via Lombok
2. **Transaction Management** - @Transactional annotation for data consistency
3. **Exception Translation** - Domain exceptions → HTTP responses
4. **Data Transformation** - DTO ↔ Entity mapping
5. **Validation Delegation** - Specialized validator classes
6. **Audit Logging** - Change tracking via timestamps and user tracking

## Detailed Documentation

- [Dependency Injection](./dependency-injection.md)
- [Transaction Management](./transaction-management.md)
- [Exception Translation](./exception-translation.md)
- [Data Transformation](./dto-transformation.md)
- [Validation Strategy](./validation-strategy.md)
- [Audit Logging](./audit-logging.md)

---

[⬅️ Back to Layers Overview](./index.md)
