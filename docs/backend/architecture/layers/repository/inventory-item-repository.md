[⬅️ Back to Layers Overview](./index.md)

# Inventory Item Repository

## Purpose

Data access for InventoryItem entities with advanced search and filtering capabilities. Manages inventory items (products) and their stock information.

## Interface Methods

```java
// Basic CRUD
Optional<InventoryItem> findById(String id);
InventoryItem save(InventoryItem entity);
void deleteById(String id);

// Search and filtering
List<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);
List<InventoryItem> findBySupplierIdOrderByNameAsc(String supplierId, Pageable pageable);
List<InventoryItem> findBySupplierId(String supplierId);

// Uniqueness checks
boolean existsByNameIgnoreCase(String name);
Optional<InventoryItem> findByNameIgnoreCase(String name);

// Custom queries
@Query("SELECT i FROM InventoryItem i WHERE i.quantity < :threshold")
List<InventoryItem> findLowStockItems(int threshold);
```

## Database Table

**Table Name:** `INVENTORY_ITEM`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| ID | UUID | PK | Unique identifier |
| NAME | VARCHAR(255) | UNIQUE, NOT NULL | Item name |
| SKU | VARCHAR(100) | | Stock keeping unit |
| SUPPLIER_ID | UUID | FK → SUPPLIER | Links to supplier |
| QUANTITY | INT | NOT NULL | Current stock quantity |
| UNIT_PRICE | DECIMAL(10,2) | NOT NULL | Cost per unit |
| CREATED_BY | VARCHAR(255) | NOT NULL | Who created |
| CREATED_AT | TIMESTAMP | NOT NULL | When created |
| VERSION | BIGINT | | Optimistic locking |

## Key Features

### Pagination Support
Large result sets handled with Spring's `Pageable` interface:
```java
List<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);
```
Reduces memory consumption and improves response time.

### Case-Insensitive Search
All search operations ignore case:
```java
boolean existsByNameIgnoreCase(String name);
Optional<InventoryItem> findByNameIgnoreCase(String name);
```
Prevents duplicate entries with different casing.

### Filtering by Supplier
Query items by their supplier:
```java
List<InventoryItem> findBySupplierIdOrderByNameAsc(String supplierId, Pageable pageable);
```
Used for supplier-specific inventory views.

### Optimistic Locking
VERSION field prevents concurrent modification conflicts:
- Hibernate automatically manages version increments
- Update fails if another thread modified the record
- Throws OptimisticLockException on conflict

---

[⬅️ Back to Layers Overview](./index.md)
