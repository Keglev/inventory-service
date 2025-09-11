package com.smartsupplypro.inventory.service;

import java.util.List;
import java.util.Optional;

import com.smartsupplypro.inventory.dto.SupplierDTO;

/**
 * Application service boundary for Supplier use-cases.
 *
 * <p>This interface defines the contract used by web controllers and other
 * application layers. Implementations enforce validation, uniqueness,
 * and business rules, and surface errors that the GlobalExceptionHandler maps
 * to HTTP statuses (400/404/409).
 *
 * <h3>Error semantics (enforced by the implementation)</h3>
 * <ul>
 *   <li>Invalid payload → {@code InvalidRequestException} (400)</li>
 *   <li>Not found → {@code NoSuchElementException} (404)</li>
 *   <li>Duplicate/Conflict → {@code DuplicateResourceException} or {@code IllegalStateException} (409)</li>
 * </ul>
 */
public interface SupplierService {

    /**
     * Retrieve all suppliers.
     *
     * <p>Used by {@code GET /api/suppliers}. Caller is responsible for authorization.
     *
     * @return immutable list of suppliers
     */
    List<SupplierDTO> findAll();

    /**
    * @return total number of suppliers (KPI).
    */
    long countSuppliers();

    /**
     * Retrieve a supplier by its ID.
     *
     * <p>Used by {@code GET /api/suppliers/{id}}. Controller typically maps
     * {@code Optional.empty()} to 404 via {@code orElseThrow()}.
     *
     * @param id supplier identifier (non-null)
     * @return supplier DTO if present
     */
    Optional<SupplierDTO> findById(String id);

    /**
     * Search suppliers by (partial, case-insensitive) name.
     *
     * <p>Used by {@code GET /api/suppliers/search?name=...}.
     *
     * @param name fragment to match (non-null; empty yields empty list)
     * @return suppliers whose names contain the fragment
     */
    List<SupplierDTO> findByName(String name);

    /**
     * Create a new supplier.
     *
     * <p>Controller ensures {@code id == null} on create and returns 201 + Location.
     *
     * @param dto input DTO (validated in the implementation)
     * @return created supplier with server-generated id/timestamps
     */
    SupplierDTO create(SupplierDTO dto);

    /**
     * Update an existing supplier.
     *
     * <p>Controller enforces that path id is authoritative; if body.id is present,
     * it must match the path id (else 400). Implementation validates payload and
     * uniqueness, and sets {@code updatedAt}.
     *
     * @param id  supplier id from path (authoritative)
     * @param dto input DTO
     * @return updated supplier DTO
     */
    SupplierDTO update(String id, SupplierDTO dto);

    /**
     * Delete a supplier after verifying no linked inventory items exist.
     *
     * @param id supplier id to delete
     */
    void delete(String id);
}
