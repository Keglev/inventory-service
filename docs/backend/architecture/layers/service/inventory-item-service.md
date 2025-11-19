[⬅️ Back to Layers Overview](./index.md)

# Inventory Item Service

## Purpose

Manage inventory items with integrated stock tracking and auditing. Items represent individual products tracked in inventory.

## Key Responsibilities

- Create items with validation of supplier and uniqueness
- Retrieve items by ID or list with pagination
- Search items by name, SKU, or supplier
- Update item details (except stock, which goes through update-stock endpoint)
- Delete items from inventory
- Update stock quantity with reason tracking
- Calculate inventory metrics and analytics

## Interface Methods

```java
List<InventoryItemDTO> findAll(Pageable pageable);
Optional<InventoryItemDTO> findById(String id);
List<InventoryItemDTO> search(String query, Pageable pageable);
InventoryItemDTO create(CreateInventoryItemDTO dto);
InventoryItemDTO update(String id, UpdateInventoryItemDTO dto);
void delete(String id);
StockUpdateResultDTO updateStock(String id, int newQuantity, 
    StockChangeReason reason, String notes);
```

## Business Rules

1. **Unique Names** - Item names must be unique within the system
2. **Valid Supplier** - Item must reference existing supplier
3. **Non-Negative Quantity** - Stock quantity cannot be negative
4. **Reason Required** - Every stock change must have a reason (PURCHASE, SALE, ADJUSTMENT, AUDIT)
5. **Initial Stock Audit** - Initial stock creates audit entry automatically
6. **Immutable History** - Stock changes are immutable (create-only, no update/delete)

## Exception Handling

- `IllegalArgumentException` (400 Bad Request) - Invalid quantity or reason
- `NoSuchElementException` (404 Not Found) - Item or supplier not found
- `DuplicateResourceException` (409 Conflict) - Name already exists
- `IllegalStateException` (409 Conflict) - Business rule violation

---

[⬅️ Back to Layers Overview](./index.md)
