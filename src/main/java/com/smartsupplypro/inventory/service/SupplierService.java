package com.smartsupplypro.inventory.service;

import java.util.List;
import java.util.Optional;

import com.smartsupplypro.inventory.dto.SupplierDTO;

/**
 * Service interface for supplier management operations.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>CRUD Operations</strong>: Create, read, update, delete suppliers</li>
 *   <li><strong>Search</strong>: Name-based partial matching</li>
 *   <li><strong>Validation</strong>: Uniqueness and business rule enforcement</li>
 *   <li><strong>Error Handling</strong>: Maps domain errors to HTTP status codes via GlobalExceptionHandler</li>
 * </ul>
 *
 * <p><strong>Error Semantics</strong>:
 * <ul>
 *   <li>Invalid payload → InvalidRequestException (400)</li>
 *   <li>Not found → NoSuchElementException (404)</li>
 *   <li>Duplicate/Conflict → DuplicateResourceException or IllegalStateException (409)</li>
 * </ul>
 *
 * @see SupplierServiceImpl
 */
public interface SupplierService {

    /**
     * Retrieves all suppliers.
     *
     * @return list of all suppliers
     */
    List<SupplierDTO> findAll();

    /**
     * Counts total suppliers (KPI).
     *
     * @return total supplier count
     */
    long countSuppliers();

    /**
     * Retrieves supplier by ID.
     *
     * @param id supplier identifier
     * @return supplier if present, empty otherwise
     */
    Optional<SupplierDTO> findById(String id);

    /**
     * Searches suppliers by partial name (case-insensitive).
     *
     * @param name search fragment
     * @return matching suppliers
     */
    List<SupplierDTO> findByName(String name);

    /**
     * Creates new supplier with validation.
     *
     * @param dto supplier data (id must be null)
     * @return created supplier with generated ID
     */
    SupplierDTO create(SupplierDTO dto);

    /**
     * Updates existing supplier with validation.
     *
     * @param id supplier ID from path (authoritative)
     * @param dto updated supplier data
     * @return updated supplier
     */
    SupplierDTO update(String id, SupplierDTO dto);

    /**
     * Deletes supplier after verifying no linked inventory items exist.
     *
     * @param id supplier ID to delete
     */
    void delete(String id);
}
