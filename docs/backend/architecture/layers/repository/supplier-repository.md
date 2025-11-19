[⬅️ Back to Layers Overview](./index.md)

# Supplier Repository

## Purpose

Data access for Supplier entities. Provides CRUD operations and queries to manage suppliers (goods providers).

## Interface Methods

```java
// Basic CRUD - provided by CrudRepository
Optional<Supplier> findById(String id);
Supplier save(Supplier entity);
void deleteById(String id);

// Spring Data derived queries
boolean existsByNameIgnoreCase(String name);
Optional<Supplier> findByNameIgnoreCase(String name);
List<Supplier> findByNameContainingIgnoreCase(String name);
```

## Database Table

**Table Name:** `SUPPLIER`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| ID | UUID | PK | Unique identifier |
| NAME | VARCHAR(255) | UNIQUE, NOT NULL | Supplier name |
| CONTACT_NAME | VARCHAR(255) | | Contact person |
| PHONE | VARCHAR(20) | | Phone number |
| EMAIL | VARCHAR(255) | | Email address |
| CREATED_BY | VARCHAR(255) | NOT NULL | Who created |
| CREATED_AT | TIMESTAMP | NOT NULL | When created |

## Key Queries

### Find All Suppliers
```java
List<Supplier> findAll();
```
**Purpose:** Used for supplier listings and dropdowns

### Search by Name
```java
List<Supplier> findByNameContainingIgnoreCase(String name);
Optional<Supplier> findByNameIgnoreCase(String name);
```
**Purpose:** Search endpoints and uniqueness validation

### Check Uniqueness
```java
boolean existsByNameIgnoreCase(String name);
```
**Purpose:** Validate supplier name before create/update

### Count Suppliers
```java
long count();
```
**Purpose:** Used for KPIs in analytics dashboard

---

[⬅️ Back to Layers Overview](./index.md)
