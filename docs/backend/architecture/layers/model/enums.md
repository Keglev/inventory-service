[⬅️ Back to Model Index](./index.md)

# Enumeration Types

Enumerations provide type-safe categorization for domain-specific values.

## Role Enumeration

**Purpose:** Define authorization levels in the system

**Location:** `src/main/java/.../enums/Role.java`

**Values:**
```java
public enum Role {
    ADMIN,   // Full system access - can create, read, update, delete
    USER     // Limited access - read-only on most operations
}
```

**Usage:**
```java
@Enumerated(EnumType.STRING)
@Column(name = "ROLE")
private Role role;
```

**Access Control:**
- **ADMIN:** Can perform all operations (CRUD on suppliers, items, etc.)
- **USER:** Can read items and analytics, but cannot modify core data

## StockChangeReason Enumeration

**Purpose:** Categorize and explain why stock quantity changed

**Location:** `src/main/java/.../enums/StockChangeReason.java`

**Values:**
```java
public enum StockChangeReason {
    PURCHASE,      // Stock increase from supplier purchase/delivery
    SALE,          // Stock decrease from customer sale
    ADJUSTMENT,    // Manual adjustment (found items, correction, etc.)
    AUDIT,         // Inventory audit/count adjustment
    RETURN,        // Return from customer (defective, unwanted)
    SHRINKAGE      // Unaccounted loss (damage, theft, etc.)
}
```

**Usage:**
```java
@Enumerated(EnumType.STRING)
@Column(name = "REASON")
private StockChangeReason reason;
```

**Business Context:**
- **PURCHASE:** Goods received from supplier
- **SALE:** Goods shipped to customer
- **ADJUSTMENT:** Corrections for counting errors
- **AUDIT:** Results from physical inventory count
- **RETURN:** Customer returns the goods
- **SHRINKAGE:** Unexplained/unaccounted loss

## Best Practices for Enumerations

### Store as STRING, Not Ordinal

```java
// ✅ Good - Stores "ADMIN" in database
@Enumerated(EnumType.STRING)
private Role role;

// ❌ Bad - Stores 0, 1, 2... (breaks if enum order changes)
@Enumerated(EnumType.ORDINAL)
private Role role;
```

### Use for Categories, Not Changeable Values

```java
// ✅ Good - Role is relatively static
@Enumerated(EnumType.STRING)
private Role role;

// ❌ Bad - Item name changes frequently
@Enumerated(EnumType.STRING)
private String itemName;  // Use regular string field
```

---

[⬅️ Back to Model Index](./index.md)
