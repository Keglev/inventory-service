package com.smartsupplypro.inventory.validation;

import java.util.Objects;
import java.util.function.BooleanSupplier;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.BusinessRuleViolationException;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Stateless validation utilities for supplier operations.
 *
 * <p>Covers required-field checks, case-insensitive name uniqueness, and
 * deletion safety. Throws {@link InvalidRequestException} (400) or
 * {@link DuplicateResourceException} (409) for the global exception handler.
 * Cannot be expressed as Bean Validation because the uniqueness check
 * requires a repository query.</p>
 *
 * @see com.smartsupplypro.inventory.service.impl.SupplierServiceImpl
 * @see SupplierRepository
 */
public final class SupplierValidator {

    private SupplierValidator() {}

    /**
     * Rejects a missing payload or a blank name.
     *
     * @param dto the supplier request
     * @throws InvalidRequestException if the payload is null or the name is blank
     */
    public static void validateBase(SupplierDTO dto) {
        if (dto == null) {
            throw new InvalidRequestException("Supplier payload must not be null");
        }
        if (isBlank(dto.getName())) {
            throw new InvalidRequestException("Supplier name must not be blank");
        }
    }

    /**
     * Rejects a name another supplier already holds, ignoring case and surrounding
     * spaces. A blank name passes here; {@link #validateBase} rejects it.
     *
     * @param repo      supplier repository
     * @param name      requested name
     * @param excludeId id of the supplier being updated, or null on create
     * @throws DuplicateResourceException if another supplier has the name
     */
    public static void assertUniqueName(SupplierRepository repo, String name, String excludeId) {
        if (isBlank(name)) return; // blank names are already rejected by validateBase

        boolean takenByAnother = repo.findByNameIgnoreCase(name.trim())
                .filter(existing -> !Objects.equals(existing.getId(), excludeId))
                .isPresent();
        if (takenByAnother) {
            throw new DuplicateResourceException("Supplier already exists", "name");
        }
    }

    /**
     * Rejects a deletion without an id, or of a supplier that still has linked items.
     *
     * @param supplierId  supplier to delete
     * @param hasAnyLinks reports whether items still reference the supplier; null skips the check
     * @throws InvalidRequestException        if the id is blank
     * @throws BusinessRuleViolationException if linked items remain
     */
    public static void assertDeletable(String supplierId, BooleanSupplier hasAnyLinks) {
        if (isBlank(supplierId)) {
            throw new InvalidRequestException("Supplier id must be provided for deletion");
        }
        if (hasAnyLinks != null && hasAnyLinks.getAsBoolean()) {
            throw new BusinessRuleViolationException("Cannot delete supplier with linked items");
        }
    }

    // ---- helpers ----------------------------------------------------------------

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}
