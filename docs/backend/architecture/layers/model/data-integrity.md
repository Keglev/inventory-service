[⬅️ Back to Model Index](./index.md)

# Data Integrity Constraints

Data integrity constraints at the database level protect data quality and consistency.

## Primary Keys

**Purpose:** Uniquely identify each record

```
SUPPLIER.ID - Unique supplier identifier
INVENTORY_ITEM.ID - Unique item identifier
STOCK_HISTORY.ID - Unique history entry identifier
APP_USER.ID - Unique user identifier
```

**Implementation:**
```java
@Id
@Column(name = "ID", nullable = false)
private String id;  // UUID or generated ID
```

**Database Constraint:**
```sql
PRIMARY KEY (ID)
```

**Benefits:**
- Every record uniquely identifiable
- Foreign keys can reference primary keys
- Prevents duplicate records
- Enables fast lookups by ID

## Unique Constraints

**Purpose:** Prevent duplicate values in specific columns

```
SUPPLIER.NAME - No two suppliers with same name
INVENTORY_ITEM.NAME - No two items with same name
APP_USER.EMAIL - No two users with same email
```

**Implementation:**
```java
@Column(name = "NAME", unique = true)
private String name;

// Multiple columns unique together
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"SUPPLIER_ID", "NAME"})
})
```

**Database Constraint:**
```sql
UNIQUE (NAME)
UNIQUE (EMAIL)
```

**Benefits:**
- Enforces business rules at database level
- Prevents data anomalies
- Database rejects invalid inserts/updates
- Faster validation than application-level checks

## Foreign Keys

**Purpose:** Enforce referential integrity between tables

```
INVENTORY_ITEM.SUPPLIER_ID → SUPPLIER.ID
STOCK_HISTORY.ITEM_ID → INVENTORY_ITEM.ID
```

**Implementation:**
```java
@Column(name = "SUPPLIER_ID", nullable = false)
private String supplierId;

@ManyToOne
@JoinColumn(name = "SUPPLIER_ID", foreignKey = 
    @ForeignKey(name = "fk_item_supplier"))
private Supplier supplier;
```

**Database Constraint:**
```sql
FOREIGN KEY (SUPPLIER_ID) REFERENCES SUPPLIER(ID)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
```

**Benefits:**
- Ensures data consistency across tables
- Prevents orphaned records
- Database enforces relationship validity
- No invalid cross-table references

## NOT NULL Constraints

**Purpose:** Enforce required fields

```
SUPPLIER.ID - Required
SUPPLIER.NAME - Required
SUPPLIER.CREATED_BY - Required
INVENTORY_ITEM.QUANTITY - Required
INVENTORY_ITEM.UNIT_PRICE - Required
STOCK_HISTORY.REASON - Required
```

**Implementation:**
```java
@Column(name = "NAME", nullable = false)
private String name;

@Column(nullable = false)
private String createdBy;
```

**Database Constraint:**
```sql
NOT NULL
```

**Benefits:**
- Ensures required data is always provided
- Prevents NULL values in critical fields
- Database rejects incomplete records
- Improves query reliability

## Constraint Summary Table

| Field | Type | Constraint | Purpose |
|---|---|---|---|
| SUPPLIER.ID | String | PK, NOT NULL | Unique identifier |
| SUPPLIER.NAME | String | UNIQUE, NOT NULL | No duplicate suppliers |
| SUPPLIER.CREATED_BY | String | NOT NULL | Audit tracking |
| INVENTORY_ITEM.ID | String | PK, NOT NULL | Unique identifier |
| INVENTORY_ITEM.NAME | String | UNIQUE, NOT NULL | No duplicate items |
| INVENTORY_ITEM.SUPPLIER_ID | String | FK, NOT NULL | Links to supplier |
| INVENTORY_ITEM.QUANTITY | Integer | NOT NULL | Required field |
| STOCK_HISTORY.REASON | Enum | NOT NULL | Required field |
| APP_USER.EMAIL | String | UNIQUE, NOT NULL | Unique user |
| APP_USER.ROLE | Enum | NOT NULL | Required field |

---

[⬅️ Back to Model Index](./index.md)
