package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.service.InventoryItemService;
import com.smartsupplypro.inventory.service.StockHistoryService;
import com.smartsupplypro.inventory.validation.InventoryItemSecurityValidator;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertFinalQuantityNonNegative;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertPriceValid;

/**
 * Implementation of {@link InventoryItemService} providing comprehensive inventory item
 * lifecycle management with integrated audit trails and business rule enforcement.
 *
 * <h2>Overview</h2>
 * <p>
 * This service coordinates all inventory item operations (CRUD) while maintaining strict
 * data integrity, security validation, and complete audit history through the stock history
 * subsystem. Every quantity or price change is recorded with timestamp, user, and reason
 * for full financial and operational traceability.
 * </p>
 *
 * <h2>Core Responsibilities</h2>
 * <ul>
 *   <li><strong>CRUD Operations</strong>: Create, read, update, delete inventory items with validation</li>
 *   <li><strong>Stock Adjustments</strong>: Handle quantity changes (positive/negative) with reason tracking</li>
 *   <li><strong>Price Management</strong>: Track unit price changes separately from quantity (WAC compatibility)</li>
 *   <li><strong>Audit Trail Integration</strong>: Log all changes via {@link StockHistoryService}</li>
 *   <li><strong>Supplier Validation</strong>: Ensure referenced suppliers exist before item creation/update</li>
 *   <li><strong>Security Enforcement</strong>: Validate user permissions for updates via {@link InventoryItemSecurityValidator}</li>
 *   <li><strong>Business Rules</strong>: Enforce uniqueness (name+price), positive prices, non-negative quantities</li>
 * </ul>
 *
 * <h2>Key Features</h2>
 *
 * <h3>1. Comprehensive Audit Trail</h3>
 * <p>
 * Every operation that changes quantity or price creates a {@code StockHistory} entry:
 * <ul>
 *   <li><strong>Creation</strong>: Logs {@code INITIAL_STOCK} with starting quantity and price</li>
 *   <li><strong>Update</strong>: Logs {@code MANUAL_UPDATE} if quantity changes (price snapshot included)</li>
 *   <li><strong>Deletion</strong>: Logs negative adjustment before hard delete (full audit trail)</li>
 *   <li><strong>Adjustment</strong>: Logs {@code quantityDelta + reason + priceSnapshot}</li>
 *   <li><strong>Price Change</strong>: Logs {@code PRICE_CHANGE} with delta=0 (preserves price history)</li>
 * </ul>
 * This enables:
 * <ul>
 *   <li>Financial reporting (COGS, inventory valuation)</li>
 *   <li>Compliance audits (who changed what, when, why)</li>
 *   <li>WAC (Weighted Average Cost) calculations</li>
 *   <li>Dispute resolution (track every stock movement)</li>
 * </ul>
 * </p>
 *
 * <h3>2. Validation Strategy (Layered Approach)</h3>
 * <p>
 * Validation is delegated to specialized static utility classes:
 * <ul>
 *   <li><strong>{@link InventoryItemValidator}</strong>:
 *     <ul>
 *       <li>{@code validateBase()}: DTO field validation (non-null, non-blank, price &gt; 0)</li>
 *       <li>{@code validateExists()}: Ensure item exists before update/delete</li>
 *       <li>{@code validateInventoryItemNotExists()}: Prevent duplicates (name+price uniqueness)</li>
 *       <li>{@code assertPriceValid()}: Business rule - unit price must be positive</li>
 *       <li>{@code assertFinalQuantityNonNegative()}: Prevent negative stock after adjustment</li>
 *     </ul>
 *   </li>
 *   <li><strong>{@link InventoryItemSecurityValidator}</strong>:
 *     <ul>
 *       <li>{@code validateUpdatePermissions()}: Check user authorization for sensitive updates</li>
 *       <li>Role-based access control (admin allowlist, ownership checks)</li>
 *     </ul>
 *   </li>
 * </ul>
 * <strong>Benefits</strong>: Centralized validation logic, reusable across service methods, testable in isolation
 * </p>
 *
 * <h3>3. Transaction Management</h3>
 * <p>
 * All write operations are wrapped in {@code @Transactional} to ensure atomicity:
 * <ul>
 *   <li>{@code save()}: Item creation + initial stock history (single transaction)</li>
 *   <li>{@code update()}: Item modification + stock history (if quantity changed)</li>
 *   <li>{@code delete()}: Stock history (negative adjustment) + hard delete (all-or-nothing)</li>
 *   <li>{@code adjustQuantity()}: Quantity update + stock history (atomic)</li>
 *   <li>{@code updatePrice()}: Price update + price change history (atomic)</li>
 * </ul>
 * Read operations use {@code @Transactional(readOnly = true)} for optimization.
 * </p>
 *
 * <h3>4. Stock History Integration Pattern</h3>
 * <p>
 * Every mutation calls {@code stockHistoryService.logStockChange()} with:
 * <pre>
 * logStockChange(itemId, quantityDelta, reason, username, priceSnapshot)
 * </pre>
 * <ul>
 *   <li><strong>quantityDelta</strong>: Positive (stock-in), negative (stock-out), or zero (price change)</li>
 *   <li><strong>reason</strong>: {@link StockChangeReason} enum (INITIAL_STOCK, PURCHASE, SALE, etc.)</li>
 *   <li><strong>username</strong>: Authenticated user from SecurityContext</li>
 *   <li><strong>priceSnapshot</strong>: Current unit price at time of change (for WAC calculations)</li>
 * </ul>
 * This pattern ensures NO stock movement goes unrecorded.
 * </p>
 *
 * <h3>5. Price Change vs Quantity Change</h3>
 * <p>
 * Important distinction for financial accuracy:
 * <ul>
 *   <li><strong>Quantity Change</strong>: Affects inventory valuation, triggers WAC recalculation
 *       <ul>
 *         <li>Logged with reason (PURCHASE, SALE, RETURNED_BY_CUSTOMER, etc.)</li>
 *         <li>Price snapshot used for cost calculation</li>
 *       </ul>
 *   </li>
 *   <li><strong>Price Change</strong>: Updates unit price WITHOUT quantity change
 *       <ul>
 *         <li>Logged as PRICE_CHANGE with delta=0</li>
 *         <li>Does NOT trigger WAC recalculation (existing stock valued at old cost)</li>
 *         <li>New purchases use new price going forward</li>
 *       </ul>
 *   </li>
 * </ul>
 * See {@link #updatePrice(String, BigDecimal)} for price-only updates vs
 * {@link #adjustQuantity(String, int, StockChangeReason)} for quantity adjustments.
 * </p>
 *
 * <h3>6. Security Integration</h3>
 * <p>
 * User context is retrieved from Spring Security's {@code SecurityContextHolder}:
 * <ul>
 *   <li>{@code currentUsername()}: Extracts authenticated username or defaults to "system"</li>
 *   <li>Used for {@code createdBy} field on creation (authoritative source)</li>
 *   <li>Recorded in stock history for every change (audit compliance)</li>
 *   <li>Permissions validated via {@link InventoryItemSecurityValidator}</li>
 * </ul>
 * </p>
 *
 * <h2>Business Rules Enforced</h2>
 * <ol>
 *   <li><strong>Uniqueness</strong>: No two items can have same name + price combination</li>
 *   <li><strong>Positive Price</strong>: Unit price must be &gt; 0 (enforced via {@code assertPriceValid()})</li>
 *   <li><strong>Non-Negative Quantity</strong>: Final quantity after adjustment cannot be negative</li>
 *   <li><strong>Supplier Existence</strong>: Referenced supplier must exist in database</li>
 *   <li><strong>Minimum Quantity Default</strong>: If not provided or &le; 0, defaults to 10</li>
 *   <li><strong>Deletion Reasons</strong>: Only specific reasons allowed (SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER)</li>
 *   <li><strong>Immutable Creator</strong>: {@code createdBy} cannot be changed after creation</li>
 * </ol>
 *
 * <h2>Performance Considerations</h2>
 * <ul>
 *   <li><strong>Pagination Support</strong>: {@link #findByNameSortedByPrice(String, Pageable)} for large datasets</li>
 *   <li><strong>Lazy Loading</strong>: Use {@code Optional<DTO>} for single item retrieval (avoid unnecessary mapping)</li>
 *   <li><strong>Batch Operations</strong>: {@link #getAll()} loads ALL items - use cautiously in production</li>
 *   <li><strong>Read-Only Transactions</strong>: {@code countItems()} uses read-only hint for optimization</li>
 * </ul>
 *
 * <h2>Error Handling</h2>
 * <p>
 * Throws {@link IllegalArgumentException} for business rule violations:
 * <ul>
 *   <li>Item not found (404 equivalent)</li>
 *   <li>Supplier not found</li>
 *   <li>Invalid deletion reason</li>
 *   <li>Duplicate item (name+price conflict)</li>
 * </ul>
 * Validation methods may throw custom exceptions (see {@link InventoryItemValidator}).
 * </p>
 *
 * <h2>Related Components</h2>
 * <ul>
 *   <li>{@link InventoryItemService} - Service interface defining contract</li>
 *   <li>{@link StockHistoryService} - Audit trail logging subsystem</li>
 *   <li>{@link InventoryItemValidator} - Business validation logic</li>
 *   <li>{@link InventoryItemSecurityValidator} - Security/permission validation</li>
 *   <li>{@link InventoryItemRepository} - Data access layer</li>
 *   <li>{@link InventoryItemMapper} - Entity/DTO conversion utilities</li>
 * </ul>
 *
 * <h2>Future Refactoring Considerations</h2>
 * <p>
 * See {@code docs/backend/INVENTORYITEMSERVICEIMPL_REFACTORING_ANALYSIS.md} for:
 * <ul>
 *   <li>Potential extraction of validation coordinator</li>
 *   <li>Stock history pattern abstraction</li>
 *   <li>Security context extraction as reusable component</li>
 *   <li>Cross-layer reuse opportunities</li>
 * </ul>
 * </p>
 *
 * @see InventoryItemService
 * @see StockHistoryService
 * @see InventoryItemValidator
 * @see InventoryItemSecurityValidator
 */
@Service
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository repository;
    private final StockHistoryService stockHistoryService;
    private final SupplierRepository supplierRepository;

    /**
     * Constructs the InventoryItemService with required dependencies.
     * 
     * <p>Dependencies are injected by Spring's constructor injection pattern,
     * which promotes immutability and easier testing.</p>
     *
     * @param repository the inventory item repository for database operations
     * @param stockHistoryService the audit trail logging service
     * @param supplierRepository the supplier repository for validation
     */
    public InventoryItemServiceImpl(
            InventoryItemRepository repository,
            StockHistoryService stockHistoryService,
            SupplierRepository supplierRepository
    ) {
        this.repository = repository;
        this.stockHistoryService = stockHistoryService;
        this.supplierRepository = supplierRepository;
    }

    /**
     * {@inheritDoc}
     * 
     * <p><strong>Performance Warning</strong>: This method loads ALL inventory items
     * into memory. In production with large datasets, prefer using pagination methods
     * like {@link #findByNameSortedByPrice(String, Pageable)}.</p>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>Admin dashboard showing complete inventory (small datasets)</li>
     *   <li>Export functionality (CSV/Excel generation)</li>
     *   <li>Bulk operations requiring all items</li>
     * </ul>
     *
     * @return list of all inventory items as DTOs (may be large!)
     */
    @Override
    public List<InventoryItemDTO> getAll() {
        return repository.findAll().stream().map(InventoryItemMapper::toDTO).toList();
    }

    /**
     * {@inheritDoc}
     * 
     * <p>Returns {@link Optional#empty()} if item not found, allowing caller
     * to handle absence gracefully (e.g., return 404 HTTP status).</p>
     * 
     * @param id the unique identifier of the inventory item
     * @return Optional containing the item DTO if found, empty otherwise
     */
    @Override
    public Optional<InventoryItemDTO> getById(String id) {
        return repository.findById(id).map(InventoryItemMapper::toDTO);
    }

    /**
     * {@inheritDoc}
     * 
     * <p><strong>Search Behavior</strong>:</p>
     * <ul>
     *   <li>Case-insensitive name matching</li>
     *   <li>Wildcard support (depends on repository implementation)</li>
     *   <li>Results sorted by price (ascending, typically)</li>
     *   <li>Pagination applied (controlled by {@code Pageable})</li>
     * </ul>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>Search bar autocomplete in UI</li>
     *   <li>Price comparison for similar items</li>
     *   <li>Inventory browsing with filters</li>
     * </ul>
     *
     * @param name the search term for item name (partial match supported)
     * @param pageable pagination and sorting parameters
     * @return paginated results sorted by price, empty page if no matches
     */
    @Override
    public Page<InventoryItemDTO> findByNameSortedByPrice(String name, Pageable pageable) {
        Page<InventoryItem> page = repository.findByNameSortedByPrice(name, pageable);
        return page == null ? Page.empty() : page.map(InventoryItemMapper::toDTO);
    }

    /**
     * {@inheritDoc}
     * 
     * <p><strong>KPI Metric</strong>: Total inventory items count, used for:</p>
     * <ul>
     *   <li>Dashboard KPI widgets</li>
     *   <li>Inventory growth tracking over time</li>
     *   <li>Capacity planning (SKU diversity)</li>
     * </ul>
     *
     * @return total count of inventory items in the database
     */
    @Override
    @Transactional(readOnly = true)
    public long countItems() {
        return repository.count();
    }

    /**
     * Creates a new inventory item with comprehensive validation and audit trail initialization.
     * 
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Populate {@code createdBy} from authenticated user if not provided</li>
     *   <li>Validate DTO fields (non-null, non-blank, price &gt; 0) via {@link InventoryItemValidator#validateBase(InventoryItemDTO)}</li>
     *   <li>Check uniqueness (name + price must be unique) via {@link InventoryItemValidator#validateInventoryItemNotExists}</li>
     *   <li>Validate supplier exists in database</li>
     *   <li>Convert DTO to entity via {@link InventoryItemMapper#toEntity(InventoryItemDTO)}</li>
     *   <li>Generate server-side fields: ID (UUID), createdBy (from SecurityContext), createdAt (now)</li>
     *   <li>Apply default minimum quantity (10) if not provided or invalid</li>
     *   <li>Persist entity to database</li>
     *   <li>Log {@code INITIAL_STOCK} history entry with starting quantity and price</li>
     *   <li>Return saved entity as DTO</li>
     * </ol>
     * 
     * <p><strong>Business Rules Applied</strong>:</p>
     * <ul>
     *   <li><strong>Uniqueness</strong>: No duplicate (name, price) combinations</li>
     *   <li><strong>Price Validation</strong>: Must be positive ({@code price &gt; 0})</li>
     *   <li><strong>Supplier Validation</strong>: Supplier must exist before item creation</li>
     *   <li><strong>Minimum Quantity Default</strong>: Set to 10 if not provided or &le; 0</li>
     *   <li><strong>Authoritative createdBy</strong>: Always set from SecurityContext (client value ignored)</li>
     * </ul>
     * 
     * <p><strong>Audit Trail</strong>:</p>
     * <p>A {@code StockHistory} entry is created with:
     * <ul>
     *   <li>{@code reason = INITIAL_STOCK}</li>
     *   <li>{@code quantityChange = initial quantity}</li>
     *   <li>{@code priceAtChange = current unit price}</li>
     *   <li>{@code createdBy = authenticated username}</li>
     * </ul>
     * This establishes the baseline for all future stock movements and WAC calculations.
     * </p>
     * 
     * <p><strong>Transaction Boundary</strong>: Both entity save and stock history logging
     * occur within a single transaction. If stock history logging fails, the entire
     * operation rolls back (no orphaned inventory items).</p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * InventoryItemDTO newItem = new InventoryItemDTO();
     * newItem.setName("Widget X");
     * newItem.setQuantity(100);
     * newItem.setPrice(new BigDecimal("25.50"));
     * newItem.setSupplierId("supplier-123");
     * newItem.setMinimumQuantity(20); // Optional, defaults to 10 if omitted
     * 
     * InventoryItemDTO saved = service.save(newItem);
     * // Result: Item persisted + INITIAL_STOCK history logged
     * </pre>
     *
     * @param dto the inventory item data transfer object (client-provided)
     * @return the saved inventory item as DTO with server-generated fields
     * @throws IllegalArgumentException if validation fails (duplicate, invalid price, missing supplier)
     */
    @Override
    @Transactional
    public InventoryItemDTO save(InventoryItemDTO dto) {
        // ===== STEP 1: Populate createdBy from authenticated user =====
        // Ensure createdBy is populated from authenticated user before validation
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            dto.setCreatedBy(currentUsername());
        }
        
        // ===== STEP 2: Validate DTO fields =====
        // Checks: non-null name, price > 0, quantity >= 0, supplierId exists
        InventoryItemValidator.validateBase(dto);
        
        // ===== STEP 3: Check uniqueness (name + price) =====
        // Business rule: No two items can have same name and price
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), repository);
        
        // ===== STEP 4: Validate supplier exists =====
        // Foreign key integrity: Supplier must exist before item creation
        validateSupplierExists(dto.getSupplierId());

        // ===== STEP 5: Convert DTO to entity =====
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        // ===== STEP 6: Generate server-side fields (authoritative source) =====
        // ID: Generate UUID if not provided
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        
        // createdBy: Always set from SecurityContext (ignore client-provided value)
        entity.setCreatedBy(currentUsername());
        
        // createdAt: Set to current timestamp if not already set
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        
        // ===== STEP 7: Apply default minimum quantity =====
        // Business rule: Default to 10 if not provided or invalid
        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10);
        }

        // ===== STEP 8: Persist entity to database =====
        InventoryItem saved = repository.save(entity);

        // ===== STEP 9: Log INITIAL_STOCK history entry =====
        // Audit trail: Record baseline quantity and price for future WAC calculations
        // This establishes the starting point for all stock movements
        stockHistoryService.logStockChange(
                saved.getId(),
                saved.getQuantity(),              // Initial quantity (positive number)
                StockChangeReason.INITIAL_STOCK,  // Special reason for first entry
                currentUsername(),                // Who created this item
                saved.getPrice()                  // Price snapshot at creation
        );

        // ===== STEP 10: Return saved entity as DTO =====
        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates an existing inventory item with validation, security checks, and audit trail.
     * 
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Validate DTO fields via {@link InventoryItemValidator#validateBase(InventoryItemDTO)}</li>
     *   <li>Validate supplier exists</li>
     *   <li>Verify item exists via {@link InventoryItemValidator#validateExists(String, InventoryItemRepository)}</li>
     *   <li>Check user permissions via {@link InventoryItemSecurityValidator#validateUpdatePermissions}</li>
     *   <li>Detect changes (name, price) and validate uniqueness if changed</li>
     *   <li>Calculate quantity delta for audit trail</li>
     *   <li>Update entity fields (name, quantity, supplierId, minimumQuantity, price)</li>
     *   <li>Persist changes to database</li>
     *   <li>Log {@code MANUAL_UPDATE} history if quantity changed</li>
     *   <li>Return updated entity as DTO</li>
     * </ol>
     * 
     * <p><strong>Business Rules Applied</strong>:</p>
     * <ul>
     *   <li><strong>Uniqueness Check</strong>: If name OR price changed, verify no duplicate (name, price)</li>
     *   <li><strong>Security Validation</strong>: User must have permissions to modify this item</li>
     *   <li><strong>Immutable createdBy</strong>: Original creator is NEVER overwritten</li>
     *   <li><strong>Conditional History</strong>: Stock history only logged if quantity changed (delta != 0)</li>
     *   <li><strong>Price Validation</strong>: If price changed, must be positive</li>
     *   <li><strong>Minimum Quantity</strong>: Only updated if new value is positive (&gt; 0)</li>
     * </ul>
     * 
     * <p><strong>Audit Trail Behavior</strong>:</p>
     * <ul>
     *   <li><strong>Quantity Changed</strong>: Logs {@code MANUAL_UPDATE} with:
     *     <ul>
     *       <li>{@code quantityChange = newQty - oldQty} (can be positive or negative)</li>
     *       <li>{@code priceAtChange = current unit price} (for WAC calculations)</li>
     *       <li>{@code createdBy = authenticated username}</li>
     *     </ul>
     *   </li>
     *   <li><strong>Quantity Unchanged</strong>: No stock history entry created (no movement to audit)</li>
     *   <li><strong>Price Changed</strong>: Stock history entry includes new price snapshot
     *       <ul>
     *         <li>Important: Price change WITHOUT quantity change does NOT trigger stock history</li>
     *         <li>Use {@link #updatePrice(String, BigDecimal)} for price-only updates with PRICE_CHANGE logging</li>
     *       </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Name/Price Change Detection</strong>:</p>
     * <p>If name OR price changes, a uniqueness check is performed to prevent conflicts:
     * <pre>
     * boolean nameChanged  = !existing.getName().equalsIgnoreCase(dto.getName());
     * boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
     * if (nameChanged || priceChanged) {
     *     // Check if (newName, newPrice) already exists for a DIFFERENT item
     *     validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
     * }
     * </pre>
     * This allows same-item updates but prevents conflicts with other items.
     * </p>
     * 
     * <p><strong>Security Enforcement</strong>:</p>
     * <p>{@link InventoryItemSecurityValidator#validateUpdatePermissions} checks:
     * <ul>
     *   <li>User is authenticated</li>
     *   <li>User has appropriate role (admin, manager, etc.)</li>
     *   <li>User is owner of the item (if ownership rules apply)</li>
     * </ul>
     * Throws exception if permissions denied.
     * </p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Update quantity only (triggers stock history)
     * InventoryItemDTO update1 = existingItem.clone();
     * update1.setQuantity(150); // Was 100
     * service.update(itemId, update1);
     * // Result: Stock history logged with delta=+50, reason=MANUAL_UPDATE
     * 
     * // Scenario 2: Update name/price (no quantity change, no stock history)
     * InventoryItemDTO update2 = existingItem.clone();
     * update2.setName("Widget X Pro");
     * update2.setPrice(new BigDecimal("30.00")); // Was 25.50
     * service.update(itemId, update2);
     * // Result: Item updated, NO stock history (quantity unchanged)
     * 
     * // Scenario 3: Update everything (quantity changed, triggers stock history)
     * InventoryItemDTO update3 = existingItem.clone();
     * update3.setName("Widget X Pro");
     * update3.setPrice(new BigDecimal("30.00"));
     * update3.setQuantity(200);
     * service.update(itemId, update3);
     * // Result: Item updated + stock history with delta=+100, new price snapshot
     * </pre>
     *
     * @param id the unique identifier of the item to update
     * @param dto the updated inventory item data
     * @return Optional containing updated item DTO (always present if no exception thrown)
     * @throws IllegalArgumentException if validation fails (item not found, duplicate, invalid supplier)
     */
    @Override
    @Transactional
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        // ===== STEP 1: Validate DTO fields =====
        InventoryItemValidator.validateBase(dto);
        
        // ===== STEP 2: Validate supplier exists =====
        validateSupplierExists(dto.getSupplierId());

        // ===== STEP 3: Verify item exists and retrieve =====
        InventoryItem existing = InventoryItemValidator.validateExists(id, repository);

        // ===== STEP 4: Check user permissions =====
        // Security validation: Ensure user can modify this item
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);

        // ===== STEP 5: Detect name/price changes for uniqueness check =====
        // If name OR price changed, check if new combination conflicts with another item
        boolean nameChanged  = !existing.getName().equalsIgnoreCase(dto.getName());
        boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
        if (nameChanged || priceChanged) {
            // Uniqueness check: (newName, newPrice) must not exist for a DIFFERENT item
            InventoryItemValidator.validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
        }

        // ===== STEP 6: Calculate quantity delta for audit trail =====
        // Positive = stock increase, Negative = stock decrease, Zero = no stock movement
        int quantityDiff = dto.getQuantity() - existing.getQuantity();

        // ===== STEP 7: Update entity fields =====
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setSupplierId(dto.getSupplierId());
        
        // Only update minimum quantity if new value is valid (> 0)
        if (dto.getMinimumQuantity() > 0) {
            existing.setMinimumQuantity(dto.getMinimumQuantity());
        }
        
        // If price changed, validate and update
        if (priceChanged) {
            assertPriceValid(dto.getPrice());
            existing.setPrice(dto.getPrice());
        }
        
        // ===== CRITICAL: DO NOT overwrite createdBy on update =====
        // Original creator must remain immutable for audit compliance
        // existing.setCreatedBy(...); // NEVER DO THIS

        // ===== STEP 8: Persist changes to database =====
        InventoryItem updated = repository.save(existing);

        // ===== STEP 9: Log stock history if quantity changed =====
        // Only create audit trail entry if there was actual stock movement
        if (quantityDiff != 0) {
            stockHistoryService.logStockChange(
                    updated.getId(),
                    quantityDiff,                     // Positive or negative delta
                    StockChangeReason.MANUAL_UPDATE,  // Generic update reason
                    currentUsername(),                // Who made the change
                    updated.getPrice()                // Price snapshot (possibly updated)
            );
        }
        // Note: If quantity unchanged, NO stock history entry is created
        // For price-only updates with PRICE_CHANGE logging, use updatePrice() instead

        // ===== STEP 10: Return updated entity as DTO =====
        return Optional.of(InventoryItemMapper.toDTO(updated));
    }

    /**
     * Deletes an inventory item after logging complete stock removal to audit trail.
     * 
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Validate deletion reason (only specific reasons allowed)</li>
     *   <li>Verify item exists</li>
     *   <li>Log negative adjustment (full quantity removal) to stock history</li>
     *   <li>Perform hard delete from database</li>
     * </ol>
     * 
     * <p><strong>Allowed Deletion Reasons</strong>:</p>
     * <p>Only the following {@link StockChangeReason} values are permitted:
     * <ul>
     *   <li><strong>SCRAPPED</strong>: Item disposed of as scrap material</li>
     *   <li><strong>DESTROYED</strong>: Item intentionally destroyed (e.g., recalled product)</li>
     *   <li><strong>DAMAGED</strong>: Item damaged beyond repair</li>
     *   <li><strong>EXPIRED</strong>: Item past expiration date (perishables)</li>
     *   <li><strong>LOST</strong>: Item lost (theft, misplacement, etc.)</li>
     *   <li><strong>RETURNED_TO_SUPPLIER</strong>: Entire stock returned to supplier</li>
     * </ul>
     * These reasons represent legitimate inventory exits requiring full audit trail.
     * </p>
     * 
     * <p><strong>Why Not Allow Other Reasons?</strong></p>
     * <ul>
     *   <li><strong>SALE</strong>: Items should be adjusted via {@link #adjustQuantity}, not deleted entirely</li>
     *   <li><strong>PURCHASE</strong>: Not a valid deletion reason (increases stock)</li>
     *   <li><strong>MANUAL_UPDATE</strong>: Too generic, specific reason required for deletion</li>
     * </ul>
     * 
     * <p><strong>Audit Trail Behavior</strong>:</p>
     * <p>Before deletion, a {@code StockHistory} entry is created:
     * <ul>
     *   <li>{@code quantityChange = -currentQuantity} (full removal, negative)</li>
     *   <li>{@code reason = provided reason} (one of the allowed values above)</li>
     *   <li>{@code priceAtChange = current unit price} (for WAC/financial reporting)</li>
     *   <li>{@code createdBy = authenticated username}</li>
     * </ul>
     * This ensures a complete audit trail even though the item is hard-deleted.
     * </p>
     * 
     * <p><strong>Hard Delete vs Soft Delete</strong>:</p>
     * <p>This implementation performs a <strong>hard delete</strong> (physical removal):
     * <ul>
     *   <li><strong>Pros</strong>: Clean database, no "zombie" records, simpler queries</li>
     *   <li><strong>Cons</strong>: Cannot recover deleted items, loses some historical context</li>
     *   <li><strong>Mitigation</strong>: Stock history preserves essential audit data</li>
     * </ul>
     * Consider soft delete (isDeleted flag) if:
     * <ul>
     *   <li>Regulatory requirements mandate data retention</li>
     *   <li>Need to restore deleted items</li>
     *   <li>Historical reports reference deleted items</li>
     * </ul>
     * </p>
     * 
     * <p><strong>Transaction Boundary</strong>:</p>
     * <p>Both stock history logging and deletion occur within a single transaction:
     * <ul>
     *   <li>If history logging fails → deletion rolls back (no orphaned delete)</li>
     *   <li>If deletion fails → history logging rolls back (no orphaned history)</li>
     * </ul>
     * Ensures atomicity of the two-step operation.
     * </p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Item damaged beyond repair
     * service.delete(itemId, StockChangeReason.DAMAGED);
     * // Result: Stock history logged with -100 (if qty was 100), then item deleted
     * 
     * // Scenario 2: Entire stock returned to supplier
     * service.delete(itemId, StockChangeReason.RETURNED_TO_SUPPLIER);
     * // Result: Full negative adjustment + deletion
     * 
     * // Scenario 3: Invalid reason (throws exception)
     * try {
     *     service.delete(itemId, StockChangeReason.SALE); // NOT ALLOWED
     * } catch (IllegalArgumentException e) {
     *     // "Invalid reason for deletion"
     * }
     * </pre>
     *
     * @param id the unique identifier of the item to delete
     * @param reason the business reason for deletion (must be one of the allowed reasons)
     * @throws IllegalArgumentException if reason is invalid or item not found
     */
    @Override
    @Transactional
    public void delete(String id, StockChangeReason reason) {
        // ===== STEP 1: Validate deletion reason =====
        // Only specific reasons allowed for complete item deletion
        if (reason != StockChangeReason.SCRAPPED &&
            reason != StockChangeReason.DESTROYED &&
            reason != StockChangeReason.DAMAGED &&
            reason != StockChangeReason.EXPIRED &&
            reason != StockChangeReason.LOST &&
            reason != StockChangeReason.RETURNED_TO_SUPPLIER) {
            throw new IllegalArgumentException("Invalid reason for deletion");
        }

        // ===== STEP 2: Verify item exists =====
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        // ===== STEP 3: Log full stock removal to audit trail =====
        // Record negative adjustment (full quantity) with price snapshot
        // This preserves audit trail even though item will be deleted
        stockHistoryService.logStockChange(
                item.getId(),
                -item.getQuantity(),              // Full removal (negative)
                reason,                           // Specific deletion reason
                currentUsername(),                // Who initiated deletion
                item.getPrice()                   // Price snapshot for financial records
        );

        // ===== STEP 4: Perform hard delete =====
        // Physical removal from database (no soft delete flag)
        repository.deleteById(id);
        // Note: Stock history remains as permanent audit record
    }

    /**
     * Adjusts inventory quantity by a delta (positive for stock-in, negative for stock-out).
     * 
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Verify item exists</li>
     *   <li>Calculate new quantity: {@code newQty = currentQty + delta}</li>
     *   <li>Validate final quantity is non-negative (cannot go below zero)</li>
     *   <li>Update item quantity</li>
     *   <li>Persist to database</li>
     *   <li>Log stock history with delta and reason</li>
     *   <li>Return updated item as DTO</li>
     * </ol>
     * 
     * <p><strong>Delta Semantics</strong>:</p>
     * <ul>
     *   <li><strong>Positive Delta</strong>: Stock increase (purchases, returns from customers, corrections)
     *     <pre>
     *     adjustQuantity(itemId, +50, PURCHASE);     // Bought 50 units
     *     adjustQuantity(itemId, +10, RETURNED_BY_CUSTOMER); // Customer returned 10
     *     </pre>
     *   </li>
     *   <li><strong>Negative Delta</strong>: Stock decrease (sales, damages, losses, returns to supplier)
     *     <pre>
     *     adjustQuantity(itemId, -30, SALE);         // Sold 30 units
     *     adjustQuantity(itemId, -5, DAMAGED);       // 5 units damaged
     *     adjustQuantity(itemId, -20, RETURNED_TO_SUPPLIER); // Returned 20 to supplier
     *     </pre>
     *   </li>
     *   <li><strong>Zero Delta</strong>: Technically allowed but creates no-op history entry (not recommended)</li>
     * </ul>
     * 
     * <p><strong>Non-Negative Quantity Enforcement</strong>:</p>
     * <p>Business rule: Final quantity cannot be negative:
     * <pre>
     * currentQty = 100
     * delta = -120
     * newQty = 100 + (-120) = -20  // ❌ INVALID
     * → throws IllegalArgumentException
     * </pre>
     * This prevents overselling or incorrect stock-out entries. If attempting to
     * reduce stock below zero, correct approach is:
     * <ol>
     *   <li>Adjust by actual available quantity: {@code adjustQuantity(id, -100, SALE)}</li>
     *   <li>Handle backorder/shortage separately in business logic</li>
     * </ol>
     * </p>
     * 
     * <p><strong>Audit Trail Behavior</strong>:</p>
     * <p>Creates {@code StockHistory} entry with:
     * <ul>
     *   <li>{@code quantityChange = delta} (exactly as provided, positive or negative)</li>
     *   <li>{@code reason = provided reason} (PURCHASE, SALE, DAMAGED, etc.)</li>
     *   <li>{@code priceAtChange = current unit price} (snapshot for WAC calculations)</li>
     *   <li>{@code createdBy = authenticated username}</li>
     * </ul>
     * </p>
     * 
     * <p><strong>Common Reasons for Adjustments</strong>:</p>
     * <table border="1">
     *   <tr>
     *     <th>Reason</th>
     *     <th>Delta</th>
     *     <th>Use Case</th>
     *   </tr>
     *   <tr>
     *     <td>PURCHASE</td>
     *     <td>Positive</td>
     *     <td>Acquiring stock from supplier</td>
     *   </tr>
     *   <tr>
     *     <td>SALE</td>
     *     <td>Negative</td>
     *     <td>Selling to customer (COGS event)</td>
     *   </tr>
     *   <tr>
     *     <td>RETURNED_BY_CUSTOMER</td>
     *     <td>Positive</td>
     *     <td>Customer returned items (restocking)</td>
     *   </tr>
     *   <tr>
     *     <td>RETURNED_TO_SUPPLIER</td>
     *     <td>Negative</td>
     *     <td>Returning defective/excess stock</td>
     *   </tr>
     *   <tr>
     *     <td>DAMAGED</td>
     *     <td>Negative</td>
     *     <td>Write-off damaged inventory</td>
     *   </tr>
     *   <tr>
     *     <td>EXPIRED</td>
     *     <td>Negative</td>
     *     <td>Write-off expired perishables</td>
     *   </tr>
     *   <tr>
     *     <td>LOST</td>
     *     <td>Negative</td>
     *     <td>Inventory shrinkage (theft, loss)</td>
     *   </tr>
     *   <tr>
     *     <td>FOUND</td>
     *     <td>Positive</td>
     *     <td>Inventory discovered (cycle count correction)</td>
     *   </tr>
     *   <tr>
     *     <td>INITIAL_STOCK</td>
     *     <td>Positive</td>
     *     <td>First-time stock entry (rarely used here)</td>
     *   </tr>
     * </table>
     * 
     * <p><strong>Transaction Boundary</strong>:</p>
     * <p>Quantity update and stock history logging occur atomically. If history
     * logging fails, quantity change rolls back (no silent failures).</p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Receive shipment from supplier
     * InventoryItemDTO updated = service.adjustQuantity("item-123", +100, StockChangeReason.PURCHASE);
     * // Result: Quantity increased by 100, stock history logged
     * 
     * // Scenario 2: Customer purchase (point of sale)
     * InventoryItemDTO after Sale = service.adjustQuantity("item-123", -5, StockChangeReason.SALE);
     * // Result: Quantity decreased by 5, SALE history entry (for COGS calculation)
     * 
     * // Scenario 3: Damage write-off
     * InventoryItemDTO afterDamage = service.adjustQuantity("item-123", -3, StockChangeReason.DAMAGED);
     * // Result: Quantity decreased by 3, DAMAGED history (financial write-off)
     * 
     * // Scenario 4: Overselling attempt (throws exception)
     * try {
     *     service.adjustQuantity("item-123", -200, StockChangeReason.SALE); // Only 100 available
     * } catch (IllegalArgumentException e) {
     *     // "Final quantity cannot be negative" (from assertFinalQuantityNonNegative)
     * }
     * </pre>
     *
     * @param id the unique identifier of the item to adjust
     * @param delta the quantity change (positive = increase, negative = decrease)
     * @param reason the business reason for the adjustment (determines financial categorization)
     * @return the updated inventory item as DTO
     * @throws IllegalArgumentException if item not found or final quantity would be negative
     */
    @Override
    @Transactional
    public InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason) {
        // ===== STEP 1: Verify item exists =====
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));

        // ===== STEP 2: Calculate new quantity =====
        int newQty = item.getQuantity() + delta;
        
        // ===== STEP 3: Validate non-negative quantity =====
        // Business rule: Cannot reduce stock below zero
        assertFinalQuantityNonNegative(newQty);

        // ===== STEP 4: Update item quantity =====
        item.setQuantity(newQty);
        
        // ===== STEP 5: Persist to database =====
        InventoryItem saved = repository.save(item);

        // ===== STEP 6: Log stock history =====
        // Record the adjustment with reason and price snapshot
        stockHistoryService.logStockChange(
                saved.getId(),
                delta,                     // Exact delta (positive or negative)
                reason,                    // Business reason (PURCHASE, SALE, etc.)
                currentUsername(),         // Who made the adjustment
                saved.getPrice()           // Price snapshot (for WAC/COGS calculations)
        );

        // ===== STEP 7: Return updated entity as DTO =====
        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates the unit price of an inventory item and logs a PRICE_CHANGE history entry.
     * 
     * <p><strong>Operation Flow</strong>:</p>
     * <ol>
     *   <li>Validate new price is positive ({@code price &gt; 0})</li>
     *   <li>Verify item exists</li>
     *   <li>Update item price</li>
     *   <li>Persist to database</li>
     *   <li>Log {@code PRICE_CHANGE} history with delta=0 (price snapshot only)</li>
     *   <li>Return updated item as DTO</li>
     * </ol>
     * 
     * <p><strong>Important Distinction: Price Change vs Quantity Change</strong>:</p>
     * <table border="1">
     *   <tr>
     *     <th>Operation</th>
     *     <th>Method</th>
     *     <th>Quantity Delta</th>
     *     <th>Stock History Reason</th>
     *     <th>WAC Impact</th>
     *   </tr>
     *   <tr>
     *     <td>Price Update</td>
     *     <td>{@code updatePrice()}</td>
     *     <td>0 (no stock movement)</td>
     *     <td>PRICE_CHANGE</td>
     *     <td>NO - Existing stock keeps old cost</td>
     *   </tr>
     *   <tr>
     *     <td>Purchase at New Price</td>
     *     <td>{@code adjustQuantity()}</td>
     *     <td>Positive</td>
     *     <td>PURCHASE</td>
     *     <td>YES - WAC recalculated with new cost</td>
     *   </tr>
     * </table>
     * 
     * <p><strong>Financial Implications</strong>:</p>
     * <ul>
     *   <li><strong>Existing Inventory</strong>: Price change does NOT revalue existing stock
     *     <ul>
     *       <li>Example: 100 units purchased @ $10 = $1,000 value</li>
     *       <li>Price updated to $12 (this method)</li>
     *       <li>Existing 100 units still valued @ $10 (WAC unchanged)</li>
     *       <li>Next purchase uses $12 for new units (WAC recalculated then)</li>
     *     </ul>
     *   </li>
     *   <li><strong>Future Purchases</strong>: New price applies to subsequent acquisitions
     *     <ul>
     *       <li>Purchase 50 more units (adjustQuantity with PURCHASE)</li>
     *       <li>New WAC = (100×$10 + 50×$12) / 150 = $10.67</li>
     *     </ul>
     *   </li>
     *   <li><strong>Audit Trail</strong>: PRICE_CHANGE entries preserve price history timeline
     *     <ul>
     *       <li>Enables price trend analysis</li>
     *       <li>Supports margin analysis over time</li>
     *       <li>Compliance with financial reporting standards</li>
     *     </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>When to Use This Method</strong>:</p>
     * <ul>
     *   <li>Supplier changes list price (no new shipment yet)</li>
     *   <li>Market price adjustment (inflation, deflation)</li>
     *   <li>Promotional pricing updates</li>
     *   <li>Correcting price entry errors</li>
     * </ul>
     * 
     * <p><strong>When NOT to Use This Method</strong>:</p>
     * <ul>
     *   <li>Receiving new stock at different price → use {@code adjustQuantity(id, qty, PURCHASE)}</li>
     *   <li>WAC recalculation needed → handled automatically by adjustQuantity</li>
     *   <li>Updating quantity + price → use {@code update(id, dto)}</li>
     * </ul>
     * 
     * <p><strong>Audit Trail Behavior</strong>:</p>
     * <p>Creates {@code StockHistory} entry with:
     * <ul>
     *   <li>{@code quantityChange = 0} (no stock movement)</li>
     *   <li>{@code reason = PRICE_CHANGE}</li>
     *   <li>{@code priceAtChange = newPrice} (the updated price)</li>
     *   <li>{@code createdBy = authenticated username}</li>
     * </ul>
     * This preserves price history timeline for analytics and compliance.
     * </p>
     * 
     * <p><strong>Example Usage</strong>:</p>
     * <pre>
     * // Scenario 1: Supplier increases price
     * BigDecimal newPrice = new BigDecimal("15.99");
     * InventoryItemDTO updated = service.updatePrice("item-123", newPrice);
     * // Result: Price updated to 15.99, PRICE_CHANGE history logged (delta=0)
     * // Existing stock still valued at old price until next purchase
     * 
     * // Scenario 2: Correcting price entry error
     * BigDecimal correctedPrice = new BigDecimal("12.50");
     * service.updatePrice("item-456", correctedPrice);
     * // Result: Price corrected, audit trail shows price change
     * 
     * // Scenario 3: Invalid price (throws exception)
     * try {
     *     service.updatePrice("item-789", BigDecimal.ZERO); // ❌ Price must be > 0
     * } catch (IllegalArgumentException e) {
     *     // "Price must be positive" (from assertPriceValid)
     * }
     * </pre>
     *
     * @param id the unique identifier of the item
     * @param newPrice the new unit price (must be &gt; 0)
     * @return the updated inventory item as DTO
     * @throws IllegalArgumentException if newPrice &le; 0 or item not found
     */
    @Override
    @Transactional
    public InventoryItemDTO updatePrice(String id, BigDecimal newPrice) {
        // ===== STEP 1: Validate price is positive =====
        assertPriceValid(newPrice);

        // ===== STEP 2: Verify item exists =====
        InventoryItem item = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
        
        // ===== STEP 3: Update item price =====
        item.setPrice(newPrice);
        
        // ===== STEP 4: Persist to database =====
        InventoryItem saved = repository.save(item);

        // ===== STEP 5: Log PRICE_CHANGE history =====
        // Record price change with delta=0 (no quantity movement)
        // This preserves price history timeline for analytics
        stockHistoryService.logStockChange(
                id,
                0,                             // No quantity change
                StockChangeReason.PRICE_CHANGE, // Special reason for price-only updates
                currentUsername(),             // Who changed the price
                newPrice                       // New price snapshot
        );
        
        // ===== STEP 6: Return updated entity as DTO =====
        return InventoryItemMapper.toDTO(saved);
    }

    // ==================================================================================
    // Helper Methods
    // ==================================================================================

    /**
     * Validates that a supplier exists in the database before creating/updating an item.
     * 
     * <p><strong>Purpose</strong>: Enforces referential integrity at the service layer.
     * Prevents orphaned inventory items pointing to non-existent suppliers.</p>
     * 
     * <p><strong>Business Rule</strong>: Every inventory item must have a valid supplier
     * reference. This ensures:</p>
     * <ul>
     *   <li>Procurement workflows can contact suppliers</li>
     *   <li>Analytics can aggregate by supplier</li>
     *   <li>Audit trails reference valid entities</li>
     * </ul>
     * 
     * <p><strong>Note</strong>: This check occurs BEFORE entity persistence, providing
     * early validation feedback to the caller (fail-fast principle).</p>
     *
     * @param supplierId the supplier identifier to validate
     * @throws IllegalArgumentException if supplier does not exist in database
     */
    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

    /**
     * Retrieves the current authenticated username from Spring Security context.
     * 
     * <p><strong>Behavior</strong>:</p>
     * <ul>
     *   <li><strong>Authenticated User</strong>: Returns {@code Authentication.getName()}
     *       <ul>
     *         <li>OAuth2: Email or sub claim (e.g., "user@example.com")</li>
     *         <li>Form Login: Username (e.g., "admin")</li>
     *       </ul>
     *   </li>
     *   <li><strong>No Authentication</strong>: Returns {@code "system"}
     *       <ul>
     *         <li>Occurs during: Background jobs, scheduled tasks, test fixtures</li>
     *         <li>Ensures audit fields never null (database constraint compliance)</li>
     *       </ul>
     *   </li>
     * </ul>
     * 
     * <p><strong>Security Context Extraction</strong>:</p>
     * <pre>
     * SecurityContextHolder.getContext()            // Thread-local context
     *     .getAuthentication()                      // Current authentication
     *     .getName()                                // Principal name/username
     * </pre>
     * 
     * <p><strong>Use Cases</strong>:</p>
     * <ul>
     *   <li>Populating {@code createdBy} field on entity creation</li>
     *   <li>Recording user in stock history audit trail</li>
     *   <li>Compliance logging (who made what change)</li>
     * </ul>
     * 
     * <p><strong>Thread Safety</strong>: {@code SecurityContextHolder} uses
     * {@code ThreadLocal} by default, so each request thread has isolated context.</p>
     * 
     * <p><strong>Future Enhancement</strong>: Consider extracting to reusable
     * {@code SecurityContextService} for cross-layer use (see refactoring analysis).</p>
     *
     * @return the authenticated username, or "system" if no authentication present
     */
    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
