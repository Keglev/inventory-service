package com.smartsupplypro.inventory.service.impl.inventory;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.validation.InventoryItemLookupValidator;
import com.smartsupplypro.inventory.validation.InventoryItemSecurityValidator;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;

import lombok.RequiredArgsConstructor;

/**
 * Validation helper for inventory item write operations.
 *
 * <p>Centralises field validation, uniqueness checks, supplier existence checks,
 * security permission checks, and server-field population (ID, createdBy, timestamps).</p>
 *
 * @see InventoryItemValidator
 * @see InventoryItemSecurityValidator
 */
@Component
@RequiredArgsConstructor
public class InventoryItemValidationHelper {

    private final InventoryItemRepository repository;
    private final SupplierRepository supplierRepository;

    /**
     * Validates a DTO for item creation.
     * Order: populate createdBy → validate base fields → check uniqueness → validate supplier.
     *
     * @param dto the inventory item DTO to validate
     * @throws IllegalArgumentException if validation fails
     */
    public void validateForCreation(InventoryItemDTO dto) {
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            dto.setCreatedBy(currentUsername());
        }
        InventoryItemValidator.validateBase(dto);
        InventoryItemLookupValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), repository);
        validateSupplierExists(dto.getSupplierId());
    }

    /**
     * Populates server-managed fields on a new entity before persistence.
     * Generates a UUID when none is present and applies a minimum-quantity default of 10.
     *
     * @param entity the inventory item entity to populate
     */
    public void populateServerFields(InventoryItem entity) {
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        // Always override createdBy from SecurityContext — client-supplied value is untrusted
        entity.setCreatedBy(currentUsername());
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10);
        }
    }

    /**
     * Validates a DTO for item update and returns the existing entity.
     * Order: validate base fields → validate supplier → assert item exists → check permissions.
     *
     * @param id  the item ID being updated
     * @param dto the updated inventory item data
     * @return the existing item entity
     * @throws IllegalArgumentException if validation or permission check fails
     */
    public InventoryItem validateForUpdate(String id, InventoryItemDTO dto) {
        InventoryItemValidator.validateBase(dto);
        validateSupplierExists(dto.getSupplierId());
        InventoryItem existing = InventoryItemLookupValidator.validateExists(id, repository);
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);
        return existing;
    }

    /**
     * Validates uniqueness when the name or price changed during an update.
     * No check is performed when neither field changed.
     *
     * @param id       the item ID being updated
     * @param existing the existing item entity
     * @param dto      the updated item data
     */
    public void validateUniquenessOnUpdate(String id, InventoryItem existing, InventoryItemDTO dto) {
        boolean nameChanged  = !existing.getName().equalsIgnoreCase(dto.getName());
        boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
        if (nameChanged || priceChanged) {
            InventoryItemLookupValidator.validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
        }
    }

    /**
     * Validates that the item exists and returns it.
     * @param id the item identifier
     * @return the existing item entity
     * @throws IllegalArgumentException if item not found
     */
    public InventoryItem validateExists(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    }

    /**
     * Validates that the item exists and that its quantity is zero before deletion.
     * @param id the item ID to validate
     * @throws IllegalArgumentException if item not found
     * @throws IllegalStateException if quantity is greater than zero
     */
    public void validateForDeletion(String id) {
        InventoryItem item = InventoryItemLookupValidator.validateExists(id, repository);
        InventoryItemValidator.assertQuantityIsZeroForDeletion(item);
    }

    /**
     * Validates that the specified supplier exists.
     * @param supplierId the supplier identifier
     * @throws IllegalArgumentException if supplier does not exist
     */
    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

    /**
     * Retrieves the current authenticated username from the Spring Security context.
     * Returns "system" when no authentication is present.
     */
    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
