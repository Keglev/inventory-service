package com.smartsupplypro.inventory.service.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.enums.StockChangeReason;
import com.smartsupplypro.inventory.mapper.InventoryItemMapper;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.service.InventoryItemService;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemAuditHelper;
import com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertFinalQuantityNonNegative;
import static com.smartsupplypro.inventory.validation.InventoryItemValidator.assertPriceValid;

import lombok.RequiredArgsConstructor;

/**
 * Service implementation for inventory item lifecycle management with audit trails.
 *
 * <p>Delegates to specialized helpers for validation and audit logging while maintaining
 * the original {@link InventoryItemService} interface contract.
 *
 * <p><strong>Delegation Strategy</strong>:
 * <ul>
 *   <li>{@link InventoryItemValidationHelper} - Validation, supplier checks, server field population</li>
 *   <li>{@link InventoryItemAuditHelper} - Stock history audit trail logging</li>
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
 * @author Smart Supply Pro Development Team
 * @version 2.0.0
 * @since 1.0.0
 * @see InventoryItemValidationHelper
 * @see InventoryItemAuditHelper
 */
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository repository;
    private final InventoryItemValidationHelper validationHelper;
    private final InventoryItemAuditHelper auditHelper;

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
     * @param dto the inventory item data transfer object
     * @return the saved inventory item as DTO with server-generated fields
     * @throws IllegalArgumentException if validation fails
     */
    @Override
    @Transactional
    public InventoryItemDTO save(InventoryItemDTO dto) {
        // Validate DTO for creation
        validationHelper.validateForCreation(dto);

        // Convert DTO to entity
        InventoryItem entity = InventoryItemMapper.toEntity(dto);

        // Populate server-side fields
        validationHelper.populateServerFields(entity);

        // Persist entity
        InventoryItem saved = repository.save(entity);

        // Log initial stock history
        auditHelper.logInitialStock(saved);

        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates an existing inventory item with validation, security checks, and audit trail.
     *
     * @param id the unique identifier of the item to update
     * @param dto the updated inventory item data
     * @return Optional containing updated item DTO
     * @throws IllegalArgumentException if validation fails
     */
    @Override
    @Transactional
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        // Validate for update and get existing item
        InventoryItem existing = validationHelper.validateForUpdate(id, dto);

        // Check uniqueness if name or price changed
        validationHelper.validateUniquenessOnUpdate(id, existing, dto);

        // Calculate quantity delta
        int quantityDiff = dto.getQuantity() - existing.getQuantity();

        // Update entity fields
        existing.setName(dto.getName());
        existing.setQuantity(dto.getQuantity());
        existing.setSupplierId(dto.getSupplierId());
        
        if (dto.getMinimumQuantity() > 0) {
            existing.setMinimumQuantity(dto.getMinimumQuantity());
        }
        
        boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
        if (priceChanged) {
            assertPriceValid(dto.getPrice());
            existing.setPrice(dto.getPrice());
        }

        // Persist changes
        InventoryItem updated = repository.save(existing);

        // Log quantity change if delta is non-zero
        auditHelper.logQuantityChange(updated, quantityDiff);

        return Optional.of(InventoryItemMapper.toDTO(updated));
    }

    /**
     * Deletes an inventory item after logging complete stock removal to audit trail.
     *
     * @param id the unique identifier of the item to delete
     * @param reason the business reason for deletion
     * @throws IllegalArgumentException if reason is invalid or item not found
     */
    @Override
    @Transactional
    public void delete(String id, StockChangeReason reason) {
        // Validate deletion reason
        if (reason != StockChangeReason.SCRAPPED &&
            reason != StockChangeReason.DESTROYED &&
            reason != StockChangeReason.DAMAGED &&
            reason != StockChangeReason.EXPIRED &&
            reason != StockChangeReason.LOST &&
            reason != StockChangeReason.RETURNED_TO_SUPPLIER) {
            throw new IllegalArgumentException("Invalid reason for deletion");
        }

        // Verify item exists
        InventoryItem item = validationHelper.validateExists(id);

        // Log full stock removal
        auditHelper.logFullRemoval(item, reason);

        // Perform hard delete
        repository.deleteById(id);
    }

    /**
     * Adjusts inventory quantity by a delta (positive for stock-in, negative for stock-out).
     *
     * @param id the unique identifier of the item to adjust
     * @param delta the quantity change
     * @param reason the business reason for the adjustment
     * @return the updated inventory item as DTO
     * @throws IllegalArgumentException if item not found or final quantity would be negative
     */
    @Override
    @Transactional
    public InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason) {
        // Verify item exists
        InventoryItem item = validationHelper.validateExists(id);

        // Calculate new quantity
        int newQty = item.getQuantity() + delta;
        
        // Validate non-negative quantity
        assertFinalQuantityNonNegative(newQty);

        // Update item quantity
        item.setQuantity(newQty);
        
        // Persist to database
        InventoryItem saved = repository.save(item);

        // Log stock history
        auditHelper.logQuantityAdjustment(saved, delta, reason);

        return InventoryItemMapper.toDTO(saved);
    }

    /**
     * Updates the unit price of an inventory item and logs a PRICE_CHANGE history entry.
     *
     * @param id the unique identifier of the item
     * @param newPrice the new unit price (must be > 0)
     * @return the updated inventory item as DTO
     * @throws IllegalArgumentException if newPrice ≤ 0 or item not found
     */
    @Override
    @Transactional
    public InventoryItemDTO updatePrice(String id, BigDecimal newPrice) {
        // Validate price is positive
        assertPriceValid(newPrice);

        // Verify item exists
        InventoryItem item = validationHelper.validateExists(id);
        
        // Update item price
        item.setPrice(newPrice);
        
        // Persist to database
        InventoryItem saved = repository.save(item);

        // Log price change history
        auditHelper.logPriceChange(id, newPrice);
        
        return InventoryItemMapper.toDTO(saved);
    }
}
