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
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
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
 * Default implementation of {@link InventoryItemService} using Spring Data JPA,
 * with validation and audit trail delegated to helper components.
 *
 * <p>{@link InventoryItemValidationHelper} covers field validation, supplier checks,
 * and server-field population. {@link InventoryItemAuditHelper} covers stock history logging.</p>
 *
 * @see InventoryItemValidationHelper
 * @see InventoryItemAuditHelper
 */
@Service
@RequiredArgsConstructor
public class InventoryItemServiceImpl implements InventoryItemService {

    private final InventoryItemRepository repository;
    private final InventoryItemValidationHelper validationHelper;
    private final InventoryItemAuditHelper auditHelper;
    private final InventoryItemMapper inventoryItemMapper;

    /** {@inheritDoc} */
    @Override
    public List<InventoryItemDTO> getAll() {
        return repository.findByActiveTrue().stream().map(inventoryItemMapper::toDTO).toList();
    }

    /** {@inheritDoc} */
    @Override
    public Optional<InventoryItemDTO> getById(String id) {
        return repository.findById(id).map(inventoryItemMapper::toDTO);
    }

    /** {@inheritDoc} */
    @Override
    public Page<InventoryItemDTO> searchItems(String name, String supplierId,
                                              boolean belowMinimumOnly, Pageable pageable) {
        Page<InventoryItem> page = repository.searchActiveItems(name, supplierId, belowMinimumOnly, pageable);
        return page == null ? Page.empty() : page.map(inventoryItemMapper::toDTO);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional(readOnly = true)
    public long countItems() {
        return repository.countByActiveTrue();
    }

    /**
     * {@inheritDoc}
     *
     * <p>Server-side fields (ID, createdBy, createdAt, minimumQuantity default)
     * are populated after validation and before persistence.</p>
     */
    @Override
    @Transactional
    public InventoryItemDTO save(InventoryItemDTO dto) {
        validationHelper.validateForCreation(dto);
        InventoryItem entity = inventoryItemMapper.toEntity(dto);
        validationHelper.populateServerFields(entity);
        InventoryItem saved = repository.save(entity);
        auditHelper.logInitialStock(saved);
        return inventoryItemMapper.toDTO(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Price validation is applied only when the price actually changed,
     * to avoid redundant checks on quantity-only updates.</p>
     */
    @Override
    @Transactional
    public Optional<InventoryItemDTO> update(String id, InventoryItemDTO dto) {
        InventoryItem existing = validationHelper.validateForUpdate(id, dto);
        validationHelper.validateUniquenessOnUpdate(id, existing, dto);

        int quantityDiff = dto.getQuantity() - existing.getQuantity();

        existing.setName(dto.getName());
        existing.setSku(dto.getSku());
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

        InventoryItem updated = repository.save(existing);
        auditHelper.logQuantityChange(updated, quantityDiff);
        return Optional.of(inventoryItemMapper.toDTO(updated));
    }

    /**
     * {@inheritDoc}
     *
     * <p>Soft delete: the row is never physically removed. The
     * item is marked inactive, which hides it from the active catalog while
     * its full stock history stays available for auditing. Only permitted
     * once the quantity is zero, so the movement that emptied the item was
     * already logged by the preceding quantity adjustment. The item's SKU
     * remains reserved by the unique constraint.</p>
     */
    @Override
    @Transactional
    public void delete(String id) {
        validationHelper.validateForDeletion(id);
        InventoryItem item = validationHelper.validateExists(id);
        item.setActive(false);
        repository.save(item);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public InventoryItemDTO adjustQuantity(String id, int delta, StockChangeReason reason) {
        InventoryItem item = validationHelper.validateExists(id);
        int newQty = item.getQuantity() + delta;
        assertFinalQuantityNonNegative(newQty);
        item.setQuantity(newQty);
        InventoryItem saved = repository.save(item);
        auditHelper.logQuantityAdjustment(saved, delta, reason);
        return inventoryItemMapper.toDTO(saved);
    }

    /** {@inheritDoc} */
    @Override
    @Transactional
    public InventoryItemDTO updatePrice(String id, BigDecimal newPrice) {
        assertPriceValid(newPrice);
        InventoryItem item = validationHelper.validateExists(id);
        item.setPrice(newPrice);
        InventoryItem saved = repository.save(item);
        auditHelper.logPriceChange(id, newPrice);
        return inventoryItemMapper.toDTO(saved);
    }

    /**
     * {@inheritDoc}
     *
     * <p>Case-insensitive duplicate check is scoped to the same supplier;
     * the same name under a different supplier is valid.</p>
     */
    @Override
    @Transactional
    public InventoryItemDTO renameItem(String id, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Item name cannot be empty");
        }

        InventoryItem existing = validationHelper.validateExists(id);

        List<InventoryItem> duplicates = repository.findByNameIgnoreCase(newName.trim());
        for (InventoryItem dup : duplicates) {
            if (!dup.getId().equals(id) && dup.getSupplierId().equals(existing.getSupplierId())) {
                throw new DuplicateResourceException("An item with this name already exists for this supplier");
            }
        }

        existing.setName(newName.trim());
        InventoryItem saved = repository.save(existing);
        return inventoryItemMapper.toDTO(saved);
    }
}
