package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.repository.InventoryItemRepository;
import com.smartsupplypro.inventory.repository.SupplierRepository;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;

/**
 * Utility class for validating business rules related to {@link SupplierDTO} operations.
 *
 * <p>This class ensures that all supplier-related data is complete, consistent, and
 * compliant with business rules before being processed or persisted.</p>
 *
 * <p><strong>Usage:</strong> This class is used primarily by the {@code SupplierService}
 * during CRUD operations to validate input and enforce constraints such as:</p>
 * <ul>
 *   <li>Uniqueness of supplier name</li>
 *   <li>Prevention of deletion when related inventory exists</li>
 *   <li>Enforcement of required fields like {@code name} and {@code createdBy}</li>
 * </ul>
 *
 * <p>Implements the utility class pattern via a private constructor and static methods only.</p>
 *
 * @author
 * SmartSupplyPro Dev Team
 */
public class SupplierValidator {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private SupplierValidator() {}

    /**
     * Validates whether a supplier can be safely deleted.
     * Prevents deletion if any inventory items are still associated with the supplier.
     *
     * @param supplierId the ID of the supplier to be deleted
     * @param inventoryRepo the repository used to check inventory references
     * @throws IllegalStateException if inventory items exist for the given supplier
     */
    public static void validateDeletable(String supplierId, InventoryItemRepository inventoryRepo) {
        if (inventoryRepo.existsBySupplier_Id(supplierId)) {
            throw new IllegalStateException("Cannot delete supplier with existing inventory items.");
        }
    }

    /**
     * Validates that a supplier with the given name does not already exist.
     * Also enforces that the name is not null or empty.
     *
     * @param name the supplier name to check for existence
     * @param supplierRepository the repository used to look up suppliers
     * @throws DuplicateResourceException if a supplier with the same name already exists
     * @throws IllegalArgumentException if the name is null or blank
     */
    public static void validateSupplierExists(String name, SupplierRepository supplierRepository) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name cannot be null or empty");
        }
        if (supplierRepository.existsByNameIgnoreCase(name)) {
            throw new DuplicateResourceException("A Supplier with this name already exists.");
        }
    }

    /**
     * Validates core fields of a {@link SupplierDTO} before creation or update.
     * Enforces non-null and non-empty values for required fields.
     *
     * @param dto the {@link SupplierDTO} to validate
     * @throws IllegalArgumentException if required fields are missing
     */
    public static void validateBase(SupplierDTO dto) {
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Supplier name must be provided.");
        }
        if (dto.getCreatedBy() == null || dto.getCreatedBy().trim().isEmpty()) {
            throw new IllegalArgumentException("CreatedBy must be provided.");
        }
    }
}
// This code provides the SupplierValidator class, which enforces validation rules for supplier data.
