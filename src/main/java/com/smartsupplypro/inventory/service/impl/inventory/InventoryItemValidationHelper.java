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
import com.smartsupplypro.inventory.validation.InventoryItemSecurityValidator;
import com.smartsupplypro.inventory.validation.InventoryItemValidator;

import lombok.RequiredArgsConstructor;

/**
 * Validation helper for inventory item operations.
 *
 * <p>Centralizes validation logic including:
 * <ul>
 *   <li>Base field validation (name, price, quantity)</li>
 *   <li>Uniqueness checks (name + price combinations)</li>
 *   <li>Supplier existence validation</li>
 *   <li>Security permission checks</li>
 *   <li>Server-side field population (ID, createdBy, timestamps)</li>
 * </ul>
 *
 * @author Smart Supply Pro Development Team
 * @version 1.0.0
 * @since 2.0.0
 */
@Component
@RequiredArgsConstructor
public class InventoryItemValidationHelper {

    private final InventoryItemRepository repository;
    private final SupplierRepository supplierRepository;

    /**
     * Validates and prepares DTO for item creation.
     *
     * <p>Steps: Populate createdBy → validate base fields → check uniqueness → validate supplier.
     *
     * @param dto the inventory item DTO to validate
     * @throws IllegalArgumentException if validation fails
     */
    public void validateForCreation(InventoryItemDTO dto) {
        // Populate createdBy from authenticated user
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            dto.setCreatedBy(currentUsername());
        }
        
        // Validate base fields
        InventoryItemValidator.validateBase(dto);
        
        // Check uniqueness (name + price)
        InventoryItemValidator.validateInventoryItemNotExists(dto.getName(), dto.getPrice(), repository);
        
        // Validate supplier exists
        validateSupplierExists(dto.getSupplierId());
    }

    /**
     * Validates and prepares entity for creation with server-side fields.
     *
     * <p>Generates: ID, createdBy, createdAt, minimum quantity default.
     *
     * @param entity the inventory item entity to populate
     */
    public void populateServerFields(InventoryItem entity) {
        // Generate UUID if not provided
        if (entity.getId() == null || entity.getId().isBlank()) {
            entity.setId(UUID.randomUUID().toString());
        }
        
        // Always set createdBy from SecurityContext (authoritative source)
        entity.setCreatedBy(currentUsername());
        
        // Set createdAt timestamp
        if (entity.getCreatedAt() == null) {
            entity.setCreatedAt(LocalDateTime.now());
        }
        
        // Apply default minimum quantity
        if (entity.getMinimumQuantity() <= 0) {
            entity.setMinimumQuantity(10);
        }
    }

    /**
     * Validates DTO for item update.
     *
     * <p>Steps: Validate base fields → validate supplier → check existence → check permissions.
     *
     * @param id the item ID being updated
     * @param dto the updated inventory item data
     * @return the existing item entity
     * @throws IllegalArgumentException if validation fails
     */
    public InventoryItem validateForUpdate(String id, InventoryItemDTO dto) {
        // Validate base fields
        InventoryItemValidator.validateBase(dto);
        
        // Validate supplier exists
        validateSupplierExists(dto.getSupplierId());

        // Verify item exists
        InventoryItem existing = InventoryItemValidator.validateExists(id, repository);

        // Check user permissions
        InventoryItemSecurityValidator.validateUpdatePermissions(existing, dto);

        return existing;
    }

    /**
     * Validates uniqueness if name or price changed during update.
     *
     * @param id the item ID being updated
     * @param existing the existing item entity
     * @param dto the updated item data
     */
    public void validateUniquenessOnUpdate(String id, InventoryItem existing, InventoryItemDTO dto) {
        boolean nameChanged  = !existing.getName().equalsIgnoreCase(dto.getName());
        boolean priceChanged = !existing.getPrice().equals(dto.getPrice());
        
        if (nameChanged || priceChanged) {
            InventoryItemValidator.validateInventoryItemNotExists(id, dto.getName(), dto.getPrice(), repository);
        }
    }

    /**
     * Validates item exists and retrieves it.
     *
     * @param id the item identifier
     * @return the existing item entity
     * @throws IllegalArgumentException if item not found
     */
    public InventoryItem validateExists(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found"));
    }

    /**
     * Validates item for deletion.
     *
     * <p>Steps: Validate item exists → check quantity is zero.
     *
     * @param id the item ID to validate for deletion
     * @throws IllegalArgumentException if item not found
     * @throws IllegalStateException if quantity is greater than zero
     */
    public void validateForDeletion(String id) {
        InventoryItem item = InventoryItemValidator.validateExists(id, repository);
        InventoryItemValidator.assertQuantityIsZeroForDeletion(item);
    }

    /**
     * Validates that the specified supplier exists.
     *
     * @param supplierId the supplier identifier
     * @throws IllegalArgumentException if supplier does not exist
     */
    private void validateSupplierExists(String supplierId) {
        if (!supplierRepository.existsById(supplierId)) {
            throw new IllegalArgumentException("Supplier does not exist");
        }
    }

    /**
     * Retrieves current authenticated username from Spring Security context.
     *
     * @return authenticated username, or "system" if no authentication present
     */
    private String currentUsername() {
        Authentication a = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication() : null;
        return a != null ? a.getName() : "system";
    }
}
