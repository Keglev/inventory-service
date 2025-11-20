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
InventoryItemDTO updatePrice(String id, BigDecimal newPrice);
InventoryItemDTO renameItem(String id, String newName);
InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason);
```

### New Method: renameItem

```java
/**
 * Renames an inventory item (changes the display name).
 * ADMIN-only operation.
 *
 * @param id      item identifier
 * @param newName new item name (must not be empty/whitespace-only)
 * @return updated inventory item DTO
 * @throws IllegalArgumentException if name is empty or already exists for this supplier
 * @throws NoSuchElementException if item not found
 */
InventoryItemDTO renameItem(String id, String newName);
```

**Implementation Details:**
- Validates that new name is not empty or whitespace-only (throws `IllegalArgumentException` with message "Item name cannot be empty")
- Checks if item exists (throws `NoSuchElementException` on failure, caught by controller and returned as 404)
- Performs case-insensitive duplicate detection within the same supplier
- Throws `IllegalArgumentException` with message "An item with this name already exists for this supplier" if duplicate detected
- Updates the item's name field
- Persists changes and returns updated `InventoryItemDTO`
- Does **not** create audit trail (pure rename, no stock change)

**Controller Handling:**
The controller catches `IllegalArgumentException` and maps messages to proper HTTP status codes:
- "empty" in message → 400 Bad Request
- "already exists" in message → 409 Conflict
- Other messages → 404 Not Found

### Method: delete

```java
/**
 * Deletes an inventory item from the system.
 * ADMIN-only operation. Item must have quantity = 0 (all stock removed).
 *
 * @param id item identifier
 * @param reason deletion reason (SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER)
 * @throws IllegalArgumentException if item not found or deletion reason invalid
 * @throws IllegalStateException if item quantity > 0 (still has merchandise in stock)
 * @throws AccessDeniedException if user is not ADMIN
 */
void delete(String id, StockChangeReason reason);
```

**Implementation Details:**
- Validates deletion reason is one of valid enum values (SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER)
- Validates item exists by ID (throws `IllegalArgumentException` on failure)
- **Enforces Business Rule**: Validates quantity = 0 before deletion
  - If quantity > 0, throws `IllegalStateException` with message "You still have merchandise in stock. You need to first remove items from stock by changing quantity."
  - This prevents accidental deletion of items with remaining inventory
- Creates audit trail entry via `auditHelper.logFullRemoval()` with deletion reason
- Deletes item from repository

**Validation Flow:**
1. Controller enforces authorization via `@PreAuthorize("hasRole('ADMIN')")`
2. Service layer validates via `InventoryItemValidator.validateExists()`
3. Service layer validates via `InventoryItemValidator.assertQuantityIsZeroForDeletion()`
4. Audit trail is logged
5. Item is removed from database

**Error Responses:**
- 400 Bad Request - Invalid deletion reason
- 404 Not Found - Item not found
- 409 Conflict - Item has quantity > 0 (still has merchandise)
- 403 Forbidden - User is not ADMIN

## Business Rules

1. **Unique Names** - Item names must be unique **per supplier** (case-insensitive)
2. **Valid Supplier** - Item must reference existing supplier
3. **Non-Negative Quantity** - Stock quantity cannot be negative
4. **Reason Required** - Every stock change must have a reason (RECEIVED, SOLD, ADJUSTED, DAMAGED, LOSS)
5. **Initial Stock Audit** - Initial stock creates audit entry automatically
6. **Immutable History** - Stock changes are immutable (create-only, no update/delete)
7. **Admin-Only Rename** - Only users with ADMIN role can rename items
8. **Non-Empty Name** - Item name must not be empty or contain only whitespace
9. **Delete Requires Zero Quantity** - Items can only be deleted when quantity = 0 (all stock removed)

## Exception Handling

- `IllegalArgumentException` (400 Bad Request) - Invalid quantity or reason
- `NoSuchElementException` (404 Not Found) - Item or supplier not found
- `DuplicateResourceException` (409 Conflict) - Name already exists
- `IllegalStateException` (409 Conflict) - Business rule violation

---

[⬅️ Back to Layers Overview](./index.md)
