[⬅️ Back to Model Index](./index.md)

# JPA Annotations

JPA (Java Persistence API) annotations map Java classes to database tables and define entity behavior.

## Identity and Basic Mapping

### @Entity and @Table

```java
@Entity                          // Marks class as JPA entity
@Table(name = "SUPPLIER")        // Maps to database table "SUPPLIER"
public class Supplier {
    
    @Id                          // Primary key field
    @Column(name = "ID")         // Column name in database
    private String id;
}
```

### @Column Constraints

```java
@Column(name = "NAME", nullable = false, unique = true)
private String name;  // NOT NULL, UNIQUE constraint

@Column(name = "EMAIL", unique = true)
private String email;  // UNIQUE constraint (NULL values allowed)

@Column(nullable = false)
private String createdBy;  // NOT NULL constraint
```

**Attributes:**
- `name` - Explicit column name in database
- `nullable` - Corresponds to NOT NULL constraint
- `unique` - Enforces UNIQUE constraint
- `length` - Max length for strings

## Timestamps and Audit

### Auto-Set Timestamps

```java
@CreationTimestamp              // Auto-set on INSERT only
@Column(updatable = false)      // Prevent UPDATEs
private LocalDateTime createdAt;

@UpdateTimestamp                // Auto-set on INSERT and UPDATE
private LocalDateTime updatedAt;
```

**Usage:**
- `@CreationTimestamp` - Set once when record created, never changes
- `@UpdateTimestamp` - Updated every time record is modified
- `updatable = false` - Protects field from being overwritten

### Audit Fields

```java
@Column(name = "CREATED_BY", nullable = false, updatable = false)
private String createdBy;  // Set from SecurityContext, immutable
```

## Relationships

### Many-to-One Relationship

```java
@ManyToOne(fetch = FetchType.EAGER)  // Multiple items → one supplier
@JoinColumn(name = "SUPPLIER_ID")    // Foreign key column
private Supplier supplier;
```

**Attributes:**
- `fetch = FetchType.EAGER` - Always load related supplier with item
- `fetch = FetchType.LAZY` - Load supplier only when accessed (slower if accessed often)
- `@JoinColumn` - Specifies foreign key column

### One-to-Many Relationship

```java
@OneToMany(mappedBy = "supplier")  // Inverse side of @ManyToOne
private List<InventoryItem> items;
```

**Attributes:**
- `mappedBy` - References the field on the other side of relationship
- Defines inverse relationship (not stored as column)

## Enumerations

### Enum Storage Options

```java
// ✅ GOOD - Stores enum name as string ("ADMIN", "USER")
@Enumerated(EnumType.STRING)
@Column(name = "ROLE")
private Role role;

// ❌ BAD - Stores enum ordinal (0, 1, 2...) - breaks if enum order changes
@Enumerated(EnumType.ORDINAL)
@Column(name = "ROLE")
private Role role;
```

**Best Practice:** Always use `EnumType.STRING` for readability and stability.

## Optimistic Locking

### Version Field

```java
@Version                        // Automatic version tracking
@Column(name = "VERSION")
private Long version;           // Incremented on each update
```

**How It Works:**
1. Hibernate reads current version from database (e.g., version = 5)
2. Business logic modifies entity
3. On UPDATE, Hibernate increments version (version = 6)
4. WHERE clause includes version check: `WHERE id = ? AND version = 5`
5. If another thread updated first, version won't match
6. Update fails with `OptimisticLockException`

**Example:**
```java
// Thread 1 reads item (version = 5)
InventoryItem item = repository.findById("abc123");
item.setQuantity(100);

// Thread 2 reads same item (version = 5) and updates first
// ...updates item, version becomes 6...

// Thread 1 tries to save - FAILS
repository.save(item);  // OptimisticLockException: version mismatch
```

---

[⬅️ Back to Model Index](./index.md)
