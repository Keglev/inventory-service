[⬅️ Back to Model Index](./index.md)

# Best Practices

Guidelines and standards for effective domain model design.

## 1. Use Lombok for Boilerplate

Lombok eliminates repetitive getter/setter/constructor code:

```java
// ✅ Good - Clean and concise
@Entity
@Data                    // Generates getters, setters, equals, hashCode, toString
@NoArgsConstructor       // No-arg constructor (required for JPA)
@AllArgsConstructor      // All-args constructor (convenient for tests)
@Builder                 // Builder pattern support
public class Supplier {
    @Id
    private String id;
    private String name;
    private String contactName;
}

// ❌ Bad - Boilerplate clutter
@Entity
public class Supplier {
    @Id
    private String id;
    private String name;
    private String contactName;
    
    public Supplier() { }
    public Supplier(String id, String name, String contactName) { ... }
    
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    
    @Override
    public boolean equals(Object o) { ... }
    
    @Override
    public int hashCode() { ... }
    
    @Override
    public String toString() { ... }
}
```

## 2. Use Appropriate Fetch Strategies

Balance efficiency with lazy loading:

```java
// ✅ Good - Supplier always needed with item
@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "SUPPLIER_ID")
private Supplier supplier;

// ❌ Bad - LAZY causes N+1 query problem
@OneToMany(fetch = FetchType.LAZY)
private List<InventoryItem> items;

// In loop:
for (Supplier s : suppliers) {
    List<InventoryItem> items = s.getItems();  // Extra query per supplier!
}
```

**Rule of Thumb:**
- `EAGER` for "always needed" relationships (Supplier with Item)
- `LAZY` for "rarely accessed" relationships (OneToMany collections)
- Use `@Query` with `JOIN FETCH` to override defaults when needed

## 3. Immutable Audit Fields

Protect audit fields from accidental modification:

```java
// ✅ Good - Immutable creation fields
@CreationTimestamp
@Column(updatable = false)
private LocalDateTime createdAt;

@Column(name = "CREATED_BY", updatable = false)
private String createdBy;

// ❌ Bad - Updatable audit fields (allows tampering)
@Column(name = "CREATED_AT")
private LocalDateTime createdAt;  // Can be modified

@Column(name = "CREATED_BY")
private String createdBy;  // Can be modified
```

**Why Immutable:**
- Audit trail integrity (can't erase who created something)
- Compliance with regulations
- Prevents accidental overwrites
- Reflects business reality (creation is immutable)

## 4. Use Enums for Categories

Type-safe enumeration over strings:

```java
// ✅ Good - Type-safe, compiler checks
@Enumerated(EnumType.STRING)
private Role role;  // Can only be ADMIN or USER

if (user.getRole() == Role.ADMIN) { ... }

// ❌ Bad - String prone to typos and errors
private String role = "ADMIN";  // Could be "admin", "Admin", "ADMN", etc.

if (user.getRole().equals("ADMIN")) { ... }  // Runtime error if typo
```

**Benefits:**
- Compiler enforces valid values
- IDE autocomplete works properly
- Type safety prevents bugs
- Refactoring is safe

## 5. Version Field for Optimistic Locking

Prevent concurrent modification conflicts:

```java
// ✅ Good - Optimistic locking enabled
@Version
private Long version;

// Hibernate automatically:
// - Increments on each update
// - Includes in WHERE clause: WHERE id = ? AND version = ?
// - Throws OptimisticLockException if stale

// ❌ Bad - No locking, concurrent updates lost
public class InventoryItem {
    private int quantity;
    // Multiple threads can update without conflict detection
}
```

**How It Works:**
```
Thread A: Read quantity = 100, version = 5
Thread B: Read quantity = 100, version = 5
Thread B: Update quantity = 90, version = 6 ✓
Thread A: Update quantity = 105, version = 5 ✗ 
         OptimisticLockException (version mismatch)
```

**Usage:**
```java
try {
    inventoryService.updateQuantity(id, newQty);
} catch (OptimisticLockException e) {
    // Refresh and retry
    InventoryItem latest = repository.findById(id);
    // Retry update with fresh data
}
```

## Summary: Entity Checklist

When creating a new entity, ensure:

- ✅ `@Entity` and `@Table` annotations
- ✅ `@Id` primary key with appropriate strategy
- ✅ `@Version` field for optimistic locking (if updatable)
- ✅ `@CreationTimestamp` and `updatable = false` for createdAt
- ✅ `@Column(updatable = false)` for createdBy
- ✅ Unique constraints for business-unique fields
- ✅ Lombok annotations (@Data, @Builder, @NoArgsConstructor)
- ✅ Foreign key columns and `@ManyToOne` with proper fetch strategy
- ✅ `@Enumerated(EnumType.STRING)` for enumerations
- ✅ Appropriate `nullable = false` constraints

---

[⬅️ Back to Model Index](./index.md)
