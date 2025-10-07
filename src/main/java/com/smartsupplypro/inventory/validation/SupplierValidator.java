package com.smartsupplypro.inventory.validation;

import java.util.Objects;
import java.util.function.BooleanSupplier;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.SupplierRepository;

/**
 * Validation utilities for supplier operations.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Base Validation</strong>: Required field checks (name)</li>
 *   <li><strong>Uniqueness</strong>: Case-insensitive name enforcement</li>
 *   <li><strong>Deletion Safety</strong>: Prevents deletion with linked items</li>
 *   <li><strong>Exception Mapping</strong>: Throws 400/409 exceptions for GlobalExceptionHandler</li>
 * </ul>
 *
 * @see SupplierService
 * @see <a href="file:../../../../../../docs/architecture/patterns/validation-patterns.md">Validation Patterns</a>
 */
public final class SupplierValidator {

    private SupplierValidator() { }

    /**
     * Validates required supplier fields (name must be non-blank).
     *
     * @param dto supplier data
     * @throws InvalidRequestException if validation fails
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
     * Enforces unique supplier name (case-insensitive).
     *
     * @param repo supplier repository
     * @param name desired supplier name
     * @param excludeId current ID for update, null for create
     * @throws DuplicateResourceException if name already exists
     */
    public static void assertUniqueName(SupplierRepository repo, String name, String excludeId) {
        if (isBlank(name)) return; // validateBase already handles blank
        String trimmed = name.trim();

        var existingOpt = repo.findByNameIgnoreCase(trimmed).map(s -> (Object) s);
        var existing = existingOpt.orElse(null);
        if (existing != null) {
            String existingId = invokeGetId(existing);
            if (!Objects.equals(existingId, excludeId)) {
                throw new DuplicateResourceException("Supplier already exists");
            }
        }
    }

    /**
     * Prevents supplier deletion when linked inventory items exist.
     * Repo-agnostic: caller supplies boolean check for link existence.
     *
     * @param supplierId supplier ID to validate
     * @param hasAnyLinks supplier returning true if links exist
     * @throws InvalidRequestException if ID is blank
     * @throws IllegalStateException if links exist (409 Conflict)
     */
    public static void assertDeletable(String supplierId, BooleanSupplier hasAnyLinks) {
        if (isBlank(supplierId)) {
            throw new InvalidRequestException("Supplier id must be provided for deletion");
        }
        if (hasAnyLinks != null && hasAnyLinks.getAsBoolean()) {
            throw new IllegalStateException("Cannot delete supplier with linked items");
        }
    }

    // ---- helpers ------------------------------------------------------------

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    /**
     * Reflective accessor for entity ID to maintain repo-agnostic design.
     *
     * @param entity supplier entity
     * @return entity ID or null
     */
    private static String invokeGetId(Object entity) {
        try {
            var m = entity.getClass().getMethod("getId");
            Object v = m.invoke(entity);
            return v != null ? v.toString() : null;
        } catch (NoSuchMethodException | IllegalAccessException | java.lang.reflect.InvocationTargetException | SecurityException e) {
            return null; // keep existing behavior: silently fall back
        }
    }
}
