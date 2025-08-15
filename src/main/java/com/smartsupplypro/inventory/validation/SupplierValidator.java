package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.SupplierDTO;
import com.smartsupplypro.inventory.exception.DuplicateResourceException;
import com.smartsupplypro.inventory.exception.InvalidRequestException;
import com.smartsupplypro.inventory.repository.SupplierRepository;

import java.util.Objects;
import java.util.Optional;
import java.util.function.BooleanSupplier;

/**
 * Central validation utilities for Supplier operations.
 *
 * <p>Design goals:
 * <ul>
 *   <li>Keep business rules close to the service layer while staying repo‑agnostic.</li>
 *   <li>Surface exceptions that your GlobalExceptionHandler maps to 400/404/409.</li>
 *   <li>Be resilient to schema differences (1‑N or N‑N item–supplier relations).</li>
 * </ul>
 */
public final class SupplierValidator {

    private SupplierValidator() { }

    /**
     * Basic field validation invoked on create/update.
     * <ul>
     *   <li>name: required, non-blank</li>
     * </ul>
     *
     * @throws InvalidRequestException if dto or required fields are invalid
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
     * Enforce unique, case-insensitive supplier name.
     *
     * @param repo       Supplier repository providing exact lookup by name
     * @param name       desired supplier name (case-insensitive)
     * @param excludeId  pass null for create; current id for update
     * @throws DuplicateResourceException if another supplier already uses the name
     */
    public static void assertUniqueName(SupplierRepository repo, String name, String excludeId) {
        if (isBlank(name)) return; // validateBase already handles blank
        String trimmed = name.trim();

        Optional<?> existingOpt = repo.findByNameIgnoreCase(trimmed).map(s -> (Object) s);
        if (existingOpt.isPresent()) {
            // We cannot type Supplier here without importing your entity class; rely on repository's id getter at service level,
            // but since we know repository returns the entity, do a safe cast:
            var existing = repo.findByNameIgnoreCase(trimmed).orElse(null);
            if (existing != null) {
                // assuming your entity has getId()
                String existingId = invokeGetId(existing);
                if (!Objects.equals(existingId, excludeId)) {
                    throw new DuplicateResourceException("Supplier already exists");
                }
            }
        }
    }

    /**
     * Prevent deletion when there are linked inventory items.
     *
     * <p>Repo-agnostic: the caller supplies a boolean check that returns true if any links exist
     * (e.g., {@code () -> itemRepo.countBySupplierId(id) > 0} or
     * {@code () -> supplierRepo.existsByIdAndItemsIsNotEmpty(id)}).</p>
     *
     * @param supplierId supplier identifier to validate
     * @param hasAnyLinks boolean supplier that must return true iff links exist
     * @throws InvalidRequestException if id is blank
     * @throws IllegalStateException if links exist (mapped to 409 Conflict)
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
     * Lightweight reflective accessor to avoid importing your entity type here.
     * If your entity package changes, this method keeps the validator stable.
     */
    private static String invokeGetId(Object entity) {
        try {
            var m = entity.getClass().getMethod("getId");
            Object v = m.invoke(entity);
            return v != null ? v.toString() : null;
        } catch (Exception ignore) {
            return null;
        }
    }
}
