# Model Layer Architecture Patterns

## Overview

The model layer in our inventory service follows enterprise JPA patterns with clean architecture principles. This layer provides entity definitions for persistent domain objects, implementing proper mapping strategies, lifecycle management, and validation constraints.

### Core Design Principles

- **Domain-Driven Design**: Entities represent core business concepts (Supplier, InventoryItem, StockHistory)
- **JPA Best Practices**: Optimal mappings, lazy loading, proper indexing
- **Audit Trail**: Comprehensive tracking with timestamps and user attribution
- **Performance**: Strategic denormalization and index placement for analytics
- **Type Safety**: Lombok integration for boilerplate reduction while maintaining readability

## Entity Patterns

### 1. Basic Entity Structure

All entities follow a consistent structure with JPA annotations, Lombok integration, and audit fields:

```java
@Entity
@Table(name = "TABLE_NAME")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EntityName {
    @Id
    @Column(name="ID", nullable = false)
    private String id;
    
    // Business fields with @Column mappings
    
    @Column(name="CREATED_BY", nullable=false)
    private String createdBy;
    
    @CreationTimestamp
    @Column(name="CREATED_AT", nullable=false, updatable=false)
    private LocalDateTime createdAt;
}
```

**Key Elements:**
- `@Entity` + `@Table` for explicit table mapping
- `@Data` for getters/setters/equals/hashCode
- Constructor variants for flexibility
- `@Builder` for fluent object creation
- Consistent audit fields across all entities

### 2. ID Generation Strategy

Our entities use String-based identifiers to support both UUID and custom business codes:

```java
@Id
@Column(name="ID", nullable = false)
private String id;
```

**Benefits:**
- Flexibility for UUID or business codes
- Database-agnostic approach
- External system integration friendly
- No auto-generation complexity

**Usage Examples:**
- **AppUser**: UUID for security
- **InventoryItem**: Business codes (SKU-based)
- **StockHistory**: UUID for immutable audit trail
- **Supplier**: Custom supplier codes

## Relationship Mappings

### 1. Many-to-One Associations

Strategic relationship mapping with performance considerations:

```java
// In InventoryItem.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
private Supplier supplier;

@Column(name="SUPPLIER_ID")
private String supplierId;
```

**Pattern Benefits:**
- **Lazy Loading**: Prevents N+1 queries
- **Read-Only Association**: `insertable=false, updatable=false`
- **Explicit Foreign Key**: Direct `supplierId` field for queries
- **Optional Navigation**: Entity reference when needed

### 2. Denormalization for Analytics

StockHistory demonstrates strategic denormalization:

```java
// In StockHistory.java
@Column(name="ITEM_ID", nullable=false)
private String itemId;

@Column(name="SUPPLIER_ID")
private String supplierId; // Denormalized from InventoryItem

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "ITEM_ID", insertable = false, updatable = false)
private InventoryItem inventoryItem;

@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
private Supplier supplier;
```

**Performance Strategy:**
- Direct `supplierId` in StockHistory eliminates JOIN for supplier analytics
- Read-only associations for data integrity
- Index-friendly foreign key columns

## Lifecycle Callbacks

### 1. PrePersist Patterns

Automatic data population before entity persistence:

```java
// In InventoryItem.java
@PrePersist
protected void onCreate() {
    if (this.supplierId == null || this.supplierId.isEmpty()) {
        // Enterprise Comment: Test scenarios may not have supplier setup
        this.supplierId = "DEFAULT_SUPPLIER";
    }
}
```

**Use Cases:**
- Default value assignment
- Business rule enforcement
- Data validation
- Audit trail initialization

### 2. Timestamp Management

Automatic timestamp handling with Hibernate annotations:

```java
@CreationTimestamp
@Column(name="CREATED_AT", nullable=false, updatable=false)
private LocalDateTime createdAt;
```

**Advantages:**
- Database-independent timestamps
- Automatic population
- Immutable creation time (`updatable=false`)
- Consistent across all entities

## Lombok Integration Patterns

### 1. Data Class Pattern

Standard Lombok setup for entities:

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Entity {
    // Fields
}
```

**Generated Methods:**
- `@Data`: getters, setters, equals, hashCode, toString
- `@NoArgsConstructor`: JPA requirement
- `@AllArgsConstructor`: Full constructor
- `@Builder`: Fluent object creation

### 2. Builder Pattern Usage

Clean object construction with validation:

```java
InventoryItem item = InventoryItem.builder()
    .id("ITEM-001")
    .name("Product Name")
    .quantity(100)
    .price(new BigDecimal("29.99"))
    .supplierId("SUPPLIER-001")
    .createdBy("system")
    .build();
```

**Benefits:**
- Immutable-style construction
- Required field validation
- Readable test code
- Optional field handling

## Indexing Strategy

### 1. Performance Indexes

Strategic index placement for query optimization:

```java
// In StockHistory.java
@Table(name = "STOCK_HISTORY", indexes = {
    @Index(name = "IX_SH_ITEM_TS", columnList = "ITEM_ID,TIMESTAMP"),
    @Index(name = "IX_SH_TS", columnList = "TIMESTAMP"),
    @Index(name = "IX_SH_SUPPLIER_TS", columnList = "SUPPLIER_ID,TIMESTAMP")
})
```

**Index Strategy:**
- **Composite Indexes**: Item + timestamp for item history queries
- **Single Column**: Timestamp for time-range analytics
- **Supplier Analytics**: Supplier + timestamp for supplier reporting
- **Naming Convention**: `IX_{table_abbreviation}_{columns}`

### 2. Query Optimization

Index selection based on actual query patterns:

```sql
-- Optimized by IX_SH_ITEM_TS
SELECT * FROM STOCK_HISTORY 
WHERE ITEM_ID = ? AND TIMESTAMP >= ?
ORDER BY TIMESTAMP DESC;

-- Optimized by IX_SH_SUPPLIER_TS  
SELECT COUNT(*), SUM(CHANGE_AMOUNT)
FROM STOCK_HISTORY 
WHERE SUPPLIER_ID = ? AND TIMESTAMP >= ?;
```

## Enum Mapping Patterns

### 1. String-Based Enums

Type-safe enum mapping with database readability:

```java
// In Role.java
@Enumerated(EnumType.STRING)
@Column(name="ROLE", nullable=false)
private Role role;

public enum Role {
    ADMIN, USER;
    
    public static Role fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return USER; // Default role
        }
        
        String cleanValue = value.trim().replaceAll("[,\\s]+", "");
        try {
            return Role.valueOf(cleanValue.toUpperCase());
        } catch (IllegalArgumentException e) {
            return USER; // Fallback for invalid values
        }
    }
}
```

**Pattern Benefits:**
- Human-readable database values
- Type safety in Java
- Backward compatibility
- Flexible parsing with fallbacks

### 2. Enum Validation

Custom parsing with business logic:

```java
// In AppUser.java
public Role getRoleEnum() {
    return Role.fromString(this.role);
}
```

**Use Cases:**
- Legacy data migration
- External system integration
- User input validation
- Default value handling

## Validation Constraints

### 1. Column-Level Validation

Database-level constraints through JPA:

```java
@Column(name="NAME", nullable=false, length=255)
private String name;

@Column(name="EMAIL", unique=true, length=320)
private String email;

@Column(name="QUANTITY", nullable=false)
private Integer quantity;
```

**Constraint Types:**
- **Nullable**: `nullable=false` for required fields
- **Length**: `length=255` for size limits
- **Uniqueness**: `unique=true` for business keys
- **Precision**: For decimal fields

### 2. Business Validation

Application-level validation in lifecycle callbacks:

```java
@PrePersist
protected void validate() {
    if (this.quantity < 0) {
        throw new IllegalArgumentException("Quantity cannot be negative");
    }
    if (this.minimumQuantity < 0) {
        throw new IllegalArgumentException("Minimum quantity cannot be negative");
    }
}
```

## Audit Trail Patterns

### 1. Standard Audit Fields

Consistent audit information across entities:

```java
@Column(name="CREATED_BY", nullable=false)
private String createdBy;

@CreationTimestamp
@Column(name="CREATED_AT", nullable=false, updatable=false)
private LocalDateTime createdAt;
```

**Audit Strategy:**
- **Created By**: User or system identifier
- **Created At**: Immutable timestamp
- **Consistent Naming**: Same pattern across all entities
- **Database Level**: Enforced constraints

### 2. Immutable Audit Entities

StockHistory as immutable audit log:

```java
// No setters for audit fields after creation
// Read-only associations to prevent modification
// Timestamp-based ordering for chronological queries
```

**Immutability Benefits:**
- Data integrity
- Regulatory compliance
- Performance (no update queries)
- Clear audit trail

## Performance Optimization

### 1. Lazy Loading Strategy

Prevent unnecessary data fetching:

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "SUPPLIER_ID", insertable = false, updatable = false)
private Supplier supplier;
```

**Best Practices:**
- Default to `FetchType.LAZY`
- Use explicit queries when associations needed
- Avoid N+1 problems with batch fetching
- Profile actual query patterns

### 2. Projection Patterns

Efficient data retrieval for specific use cases:

```java
// In repository layer - optimized projections
@Query("SELECT new com.smartsupplypro.inventory.dto.InventoryItemSummary(" +
       "i.id, i.name, i.quantity, s.name) " +
       "FROM InventoryItem i JOIN i.supplier s")
List<InventoryItemSummary> findInventorySummaries();
```

**Projection Benefits:**
- Reduced memory usage
- Faster queries
- Network optimization
- Specific DTOs for different views

## Testing Strategies

### 1. Entity Testing

Unit tests for entity behavior:

```java
@Test
void testInventoryItemCreation() {
    InventoryItem item = InventoryItem.builder()
        .id("TEST-001")
        .name("Test Product")
        .quantity(50)
        .price(new BigDecimal("19.99"))
        .supplierId("SUPPLIER-001")
        .createdBy("test-user")
        .build();
    
    assertThat(item.getId()).isEqualTo("TEST-001");
    assertThat(item.getQuantity()).isEqualTo(50);
}
```

### 2. Persistence Testing

Integration tests with real database:

```java
@DataJpaTest
class SupplierRepositoryTest {
    
    @Test
    void testSaveAndRetrieve() {
        Supplier supplier = Supplier.builder()
            .id("SUPPLIER-001")
            .name("Test Supplier")
            .contactName("John Doe")
            .createdBy("test")
            .build();
        
        Supplier saved = supplierRepository.save(supplier);
        assertThat(saved.getCreatedAt()).isNotNull();
    }
}
```

## Error Handling

### 1. Constraint Violations

Graceful handling of database constraints:

```java
try {
    supplierRepository.save(supplier);
} catch (DataIntegrityViolationException e) {
    if (e.getMessage().contains("unique constraint")) {
        throw new SupplierAlreadyExistsException("Supplier with this name already exists");
    }
    throw new DataAccessException("Failed to save supplier", e);
}
```

### 2. Validation Errors

Business rule validation:

```java
@PrePersist
protected void validateBusinessRules() {
    if (this.minimumQuantity > this.quantity) {
        throw new InvalidInventoryStateException(
            "Minimum quantity cannot exceed current quantity");
    }
}
```

## Integration Patterns

### 1. DTO Mapping

Clean separation between entities and external interfaces:

```java
// Entity remains internal
public class InventoryItem { ... }

// DTO for external APIs
public class InventoryItemDTO {
    private String id;
    private String name;
    private Integer quantity;
    private String supplierName; // Flattened from association
}
```

### 2. Event Publishing

Domain events for cross-cutting concerns:

```java
@PostPersist
protected void publishCreatedEvent() {
    applicationEventPublisher.publishEvent(
        new InventoryItemCreatedEvent(this.id, this.name));
}
```

## Migration Strategies

### 1. Schema Evolution

Safe database schema changes:

```sql
-- Add new optional columns first
ALTER TABLE INVENTORY_ITEM ADD COLUMN MINIMUM_QUANTITY INTEGER;

-- Update existing data
UPDATE INVENTORY_ITEM SET MINIMUM_QUANTITY = 0 WHERE MINIMUM_QUANTITY IS NULL;

-- Add constraints after data migration
ALTER TABLE INVENTORY_ITEM ALTER COLUMN MINIMUM_QUANTITY SET NOT NULL;
```

### 2. Data Migration

Entity-based data transformation:

```java
@Component
public class InventoryDataMigration {
    
    @Transactional
    public void migrateMinimumQuantities() {
        List<InventoryItem> items = inventoryRepository.findByMinimumQuantityIsNull();
        items.forEach(item -> {
            item.setMinimumQuantity(0); // Business default
            inventoryRepository.save(item);
        });
    }
}
```

## Best Practices Summary

### 1. Design Principles

- **Single Responsibility**: Each entity represents one business concept
- **Explicit Mapping**: Always specify table and column names
- **Lazy Loading**: Default to lazy for associations
- **Immutable Audit**: Never modify audit trail records
- **Consistent Naming**: Follow database naming conventions

### 2. Performance Guidelines

- **Index Critical Paths**: Index foreign keys and query columns
- **Denormalize Strategically**: Copy foreign keys for analytics
- **Batch Operations**: Use repository batch methods for bulk operations
- **Projection Queries**: Create specific DTOs for read operations
- **Connection Management**: Use appropriate fetch strategies

### 3. Maintenance Guidelines

- **Schema Versioning**: Track all database changes
- **Backward Compatibility**: Design for graceful evolution
- **Documentation**: Update patterns documentation with schema changes
- **Testing Coverage**: Test entity behavior, constraints, and relationships
- **Monitoring**: Track query performance and database metrics

## Related Documentation

- [Repository Patterns](/docs/architecture/patterns/repository-patterns.md) - Data access layer patterns
- [Validation Patterns](/docs/architecture/patterns/validation-patterns.md) - Input validation strategies
- [Service Layer Architecture](../services/README.md) - Business logic patterns
 - [API Documentation](../../api/redoc/api.html) - External interface contracts


*This documentation is maintained alongside the entity implementations. Update patterns when adding new entities or modifying existing ones.*