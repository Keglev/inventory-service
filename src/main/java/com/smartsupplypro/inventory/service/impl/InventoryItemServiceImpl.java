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
 * Service implementation for inventory item lifecycle management with audit trails.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>CRUD Operations</strong>: Create, read, update, delete with validation</li>
 *   <li><strong>Audit Trail Integration</strong>: Every change logged via {@link StockHistoryService}</li>
 *   <li><strong>Validation Delegation</strong>: {@link InventoryItemValidator} + {@link InventoryItemSecurityValidator}</li>
 *   <li><strong>Security Context</strong>: Authenticated user tracking for audit compliance</li>
 *   <li><strong>Stock Adjustments</strong>: Quantity changes with reason tracking</li>
 *   <li><strong>Price Management</strong>: Separate price updates (WAC compatibility)</li>
 * </ul>
 *
 * <p><strong>Key Patterns</strong>:
 * <ul>
 *   <li>Every mutation → stock history log (quantity delta + reason + user + price snapshot)</li>
 *   <li>Transactional atomicity (item change + audit log in single transaction)</li>
 *   <li>Layered validation (business rules + security permissions)</li>
 *   <li>Supplier existence validation before item creation/update</li>
 * </ul>
 *
 * <p><strong>Business Rules</strong>:
 * <ul>
 *   <li>Uniqueness: No duplicate name+price combinations</li>
 *   <li>Positive prices: Unit price must be > 0</li>
 *   <li>Non-negative quantities: Final quantity cannot be negative after adjustment</li>
 *   <li>Supplier validation: Referenced supplier must exist</li>
 * </ul>
 *
 * <p><strong>Transaction Management</strong>:
 * Write operations use {@code @Transactional}, read operations use {@code @Transactional(readOnly = true)}.
 *
 * <p><strong>Architecture Documentation</strong>:
 * For detailed operation flows, audit trail patterns, security integration, and refactoring notes, see:
 * <a href="../../../../../../docs/architecture/services/inventory-item-service.md">Inventory Item Service Architecture</a>
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
     * Constructor with dependency injection.
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
     * <p><strong>Performance Warning</strong>: Loads ALL items. Use pagination for large datasets.
     *
     * @return list of all inventory items as DTOs
     */
    @Override
    public List<InventoryItemDTO> getAll() {
        return repository.findAll().stream().map(InventoryItemMapper::toDTO).toList();
    }

    /**
     * {@inheritDoc}
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
     * @return total count of inventory items in the database
     */
    @Override
    @Transactional(readOnly = true)
    public long countItems() {
        return repository.count();
    }

    /**
     * Creates a new inventory item with validation and audit trail initialization.
     * 
     * <p><strong>Operation Flow</strong>: Validates DTO → checks uniqueness → validates supplier → 
     * generates server fields → persists entity → logs INITIAL_STOCK history.
     * 
     * <p><strong>Key Rules</strong>:
     * <ul>
     *   <li>Uniqueness: No duplicate (name, price) combinations</li>
     *   <li>Price validation: Must be positive (price > 0)</li>
     *   <li>Supplier validation: Must exist before item creation</li>
     *   <li>Minimum quantity default: 10 if not provided or ≤ 0</li>
     *   <li>Authoritative createdBy: Always from SecurityContext</li>
     * </ul>
     * 
     * <p><strong>Audit Trail</strong>: Creates {@code StockHistory} entry with reason=INITIAL_STOCK, 
     * quantityChange=initial quantity, user=authenticated username, price=current unit price.
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
     * <p><strong>Key Rules</strong>:
     * <ul>
     *   <li>Security validation: User permissions checked before update</li>
     *   <li>Uniqueness check: If name OR price changed, verify no duplicate (name, price)</li>
     *   <li>Immutable createdBy: Original creator never overwritten</li>
     *   <li>Conditional audit: Stock history only logged if quantity changed (delta ≠ 0)</li>
     *   <li>Price validation: If price changed, must be positive</li>
     * </ul>
     * 
     * <p><strong>Audit Trail Behavior</strong>:
     * <ul>
     *   <li><strong>Quantity Changed</strong>: Logs MANUAL_UPDATE with quantityDelta and price snapshot</li>
     *   <li><strong>Quantity Unchanged</strong>: No stock history entry (no movement to audit)</li>
     * </ul>
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
     * <p><strong>Allowed Deletion Reasons</strong>: SCRAPPED, DESTROYED, DAMAGED, EXPIRED, LOST, RETURNED_TO_SUPPLIER.
     * 
     * <p><strong>Audit Trail</strong>: Before deletion, creates StockHistory entry with 
     * quantityChange=-currentQuantity, reason=provided reason, price=current price, user=authenticated username.
     * 
     * <p><strong>Hard Delete</strong>: Item physically removed from database (not soft delete with flag).
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
     * <p><strong>Key Rules</strong>:
     * <ul>
     *   <li>Final quantity cannot be negative (prevents overselling)</li>
     *   <li>Positive delta: Stock increase (purchases, returns from customers)</li>
     *   <li>Negative delta: Stock decrease (sales, damages, losses)</li>
     *   <li>Zero delta: Allowed but creates no-op history entry</li>
     * </ul>
     * 
     * <p><strong>Audit Trail</strong>: Creates StockHistory entry with quantityChange=delta, 
     * reason=provided reason, price=current unit price, user=authenticated username.
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
     * <p><strong>Key Distinction</strong>: Price change vs quantity change:
     * <ul>
     *   <li><strong>updatePrice()</strong>: Changes price only, logs PRICE_CHANGE with delta=0, NO WAC impact</li>
     *   <li><strong>adjustQuantity()</strong>: Changes quantity, logs with actual delta, triggers WAC recalculation</li>
     * </ul>
     * 
     * <p><strong>Financial Impact</strong>: Existing inventory NOT revalued (keeps old cost). 
     * New price applies to future purchases only.
     * 
     * <p><strong>Audit Trail</strong>: Creates StockHistory entry with quantityChange=0, 
     * reason=PRICE_CHANGE, price=newPrice, user=authenticated username.
     *
     * @param id the unique identifier of the item
     * @param newPrice the new unit price (must be > 0)
     * @return the updated inventory item as DTO
     * @throws IllegalArgumentException if newPrice ≤ 0 or item not found
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
     * Validates that the specified supplier exists in the database.
     * 
     * <p>Ensures inventory items reference valid suppliers for procurement workflows, 
     * analytics aggregation, and audit trail integrity.
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
     * <p><strong>Behavior</strong>: Returns Authentication.getName() if authenticated, 
     * otherwise "system" (for background jobs, scheduled tasks, test fixtures).
     * 
     * <p><strong>Security Pattern</strong>: Used for audit trail compliance - 
     * populates createdBy fields and stock history user tracking.
     *
     * @return the authenticated username, or "system" if no authentication present
     */
    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
