[⬅️ Back to Controller Index](./index.md)

# Core Controllers

This section describes the main controllers in the Smart Supply Pro API and their responsibilities.

## SupplierController

**Purpose:** Manage suppliers (CRUD operations)

**Endpoints:**
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/{id}` - Get supplier by ID
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Delete supplier
- `GET /api/suppliers/search?name=...` - Search suppliers

**Authorization:** USER can read, ADMIN can modify

**Key Methods:**
```java
@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {
    
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<SupplierDTO>> listAll() { ... }
    
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierDTO> create(@Valid @RequestBody CreateSupplierDTO dto) { ... }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) { ... }
}
```

## InventoryItemController

**Purpose:** Manage inventory items with stock tracking

**Endpoints:**
- `GET /api/inventory/items` - List items (paginated)
- `POST /api/inventory/items` - Create item
- `GET /api/inventory/items/{id}` - Get item details
- `PUT /api/inventory/items/{id}` - Update item
- `DELETE /api/inventory/items/{id}` - Delete item
- `POST /api/inventory/items/{id}/update-stock` - Update stock quantity

**Authorization:** USER can read, ADMIN can modify

**Features:**
- Pagination support (page, size parameters)
- Stock quantity updates with audit trail
- Low stock alerts via analytics

## StockHistoryController

**Purpose:** Query stock change audit trail

**Endpoints:**
- `GET /api/stock-history` - List all stock movements
- `GET /api/stock-history?itemId=...` - Filter by item
- `GET /api/stock-history/summary` - Aggregate statistics

**Authorization:** USER read-only (immutable audit trail)

**Features:**
- Immutable stock change records
- Reason tracking (PURCHASE, SALE, ADJUSTMENT, AUDIT, RETURN, SHRINKAGE)
- Timestamp and creator tracking

## AnalyticsController

**Purpose:** Provide analytics and reporting endpoints

**Endpoints:**
- `GET /api/analytics/dashboard` - Dashboard summary (KPIs)
- `GET /api/analytics/financial-summary` - Financial metrics
- `GET /api/analytics/inventory-trends` - Trend analysis
- `GET /api/analytics/low-stock` - Low stock alerts

**Authorization:** USER can read analytics

**Key Metrics:**
- Weighted average cost (WAC)
- Inventory value trends
- Stock utilization rates
- Low stock warnings

## AuthController

**Purpose:** OAuth2 authentication endpoints

**Endpoints:**
- `POST /api/auth/callback` - OAuth2 callback handler
- `GET /api/auth/user` - Current user info
- `POST /api/auth/logout` - User logout

**Authorization:** 
- PUBLIC for login/callback endpoints
- AUTHENTICATED for logout and user info

**Features:**
- Google OAuth2 integration
- GitHub OAuth2 integration
- Automatic user provisioning on first login
- Session management

---

[⬅️ Back to Controller Index](./index.md)
