[⬅️ Back to Layers Overview](./index.md)

# Supplier Service

## Purpose

Manage supplier lifecycle (create, read, update, delete with validation). Suppliers represent goods providers in the inventory system.

## Key Responsibilities

- Create new suppliers with uniqueness validation
- Retrieve suppliers by ID or list all
- Search suppliers by name (partial matching)
- Update supplier information
- Delete suppliers with constraint validation (e.g., cannot delete if used in inventory)
- Count suppliers for KPIs

## Interface Methods

```java
List<SupplierDTO> findAll();
long countSuppliers();
Optional<SupplierDTO> findById(String id);
List<SupplierDTO> search(String name);
SupplierDTO create(CreateSupplierDTO dto);
SupplierDTO update(String id, UpdateSupplierDTO dto);
void delete(String id);
```

## Business Rules

1. **Unique Names** - Supplier names must be unique (case-insensitive)
2. **Required Fields** - All required fields (name, contact) must be provided
3. **Deletion Constraint** - Supplier can only be deleted if no items are sourced from them
4. **Audit Preservation** - Update preserves audit fields (createdBy, createdAt)

## Exception Handling

- `DuplicateResourceException` (409 Conflict) - Name already exists
- `NoSuchElementException` (404 Not Found) - Supplier not found
- `IllegalStateException` (409 Conflict) - Cannot delete (has items)

---

[⬅️ Back to Layers Overview](./index.md)
