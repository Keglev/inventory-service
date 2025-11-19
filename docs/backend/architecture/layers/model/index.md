[⬅️ Back to Layers Overview](../overview.html)

# Domain Model & Data Layer

The **Domain Model Layer** represents the core business entities and their relationships. These JPA entities map directly to database tables and form the foundation of the application's data persistence.

**Location:** `src/main/java/com/smartsupplypro/inventory/model/`

**Responsibility:** Entity definitions, relationships, constraints, audit tracking, enumeration types

## Quick Navigation

### By Topic
- **[Supplier Entity](./supplier-entity.md)** - Inventory goods providers
- **[Inventory Item Entity](./inventory-item-entity.md)** - Products/items in inventory
- **[Stock History Entity](./stock-history-entity.md)** - Immutable audit trail
- **[App User Entity](./app-user-entity.md)** - OAuth2 users and authentication
- **[Enumerations](./enums.md)** - Role and StockChangeReason types
- **[Entity Relationships](./relationships.md)** - Supplier → Item → StockHistory, User relationships
- **[JPA Annotations](./jpa-annotations.md)** - @Entity, @Column, @ManyToOne, @Version, etc.
- **[Design Patterns](./design-patterns.md)** - Audit fields, optimistic locking, denormalization
- **[Data Integrity](./data-integrity.md)** - Primary keys, unique constraints, foreign keys
- **[Model Lifecycle](./lifecycle.md)** - Transient → Managed → Persistent states
- **[Best Practices](./best-practices.md)** - Lombok, fetch strategies, immutability

### By Role
- **Database Designers** → Start with [Entity Relationships](./relationships.md)
- **ORM Developers** → Review [JPA Annotations](./jpa-annotations.md)
- **Backend Developers** → Check [Supplier Entity](./supplier-entity.md) and [Inventory Item Entity](./inventory-item-entity.md)
- **Data Architects** → Review [Data Integrity](./data-integrity.md) and [Design Patterns](./design-patterns.md)
- **New Team Members** → Begin with [Best Practices](./best-practices.md)

## Core Entities Overview

- **Supplier** - Inventory goods providers with contact information
- **InventoryItem** - Individual products/items with stock tracking
- **StockHistory** - Immutable audit trail of all stock movements
- **AppUser** - OAuth2 user principals with roles

---

[⬅️ Back to Layers Overview](../overview.html)
