package com.smartsupplypro.inventory.validation;

import java.util.Objects;
import java.util.function.BooleanSupplier;

import com.smartsupplypro.inventory.dto.SupplierDTO;
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

    public static void validateBase(SupplierDTO dto) {
        if (dto == null) {
            throw new InvalidRequestException("Supplier payload must not be null");
        }
        if (isBlank(dto.getName())) {
            throw new InvalidRequestException("Supplier name must not be blank");
        }
    }

    public static void assertUniqueName(SupplierRepository repo, String name, String excludeId) {
        if (isBlank(name)) return; // blank names are already rejected by validateBase

        var existing = repo.findByNameIgnoreCase(name.trim()).map(s -> (Object) s).orElse(null);
        if (existing != null && !Objects.equals(invokeGetId(existing), excludeId)) {
            throw new DuplicateResourceException("Supplier already exists", "name");
        }
    }

    public static void assertDeletable(String supplierId, BooleanSupplier hasAnyLinks) {
        if (isBlank(supplierId)) {
            throw new InvalidRequestException("Supplier id must be provided for deletion");
        }
        if (hasAnyLinks != null && hasAnyLinks.getAsBoolean()) {
            throw new IllegalStateException("Cannot delete supplier with linked items");
        }
    }

    // ---- helpers ----------------------------------------------------------------

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String invokeGetId(Object entity) {
        try {
            var m = entity.getClass().getMethod("getId");
            Object v = m.invoke(entity);
            return v != null ? v.toString() : null;
        } catch (NoSuchMethodException | IllegalAccessException |
                 java.lang.reflect.InvocationTargetException | SecurityException e) {
            return null; // reflective access failed; null ID lets Objects.equals decide the outcome
        }
    }
}
