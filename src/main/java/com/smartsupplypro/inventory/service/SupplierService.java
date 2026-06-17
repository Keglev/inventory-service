package com.smartsupplypro.inventory.service;

import java.util.List;
import java.util.Optional;

import com.smartsupplypro.inventory.dto.SupplierDTO;

/**
 * Service contract for supplier lifecycle management.
 *
 * <p>Defines operations for supplier creation, retrieval,
 * update, and deactivation within the procurement domain.</p>
 *
 * @see SupplierServiceImpl
 * @see com.smartsupplypro.inventory.repository.SupplierRepository
 */
public interface SupplierService {

    /**
     * Retrieves all suppliers.
     * @return list of all suppliers
     */
    List<SupplierDTO> findAll();

    /**
     * Counts total suppliers (KPI).
     * @return total supplier count
     */
    long countSuppliers();

    /**
     * Retrieves a supplier by ID.
     * @param id supplier identifier
     * @return supplier if present, empty otherwise
     */
    Optional<SupplierDTO> findById(String id);

    /**
     * Searches suppliers by partial name (case-insensitive).
     * @param name search fragment
     * @return matching suppliers
     */
    List<SupplierDTO> findByName(String name);

    /**
     * Creates a new supplier after validating name uniqueness.
     * @param dto supplier data (id must be null)
     * @return created supplier with generated ID
     * @throws com.smartsupplypro.inventory.exception.InvalidRequestException if validation fails
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name already exists
     */
    SupplierDTO create(SupplierDTO dto);

    /**
     * Updates an existing supplier after validating name uniqueness.
     * @param id  supplier ID from path (authoritative)
     * @param dto updated supplier data
     * @return updated supplier
     * @throws java.util.NoSuchElementException if supplier not found
     * @throws com.smartsupplypro.inventory.exception.DuplicateResourceException if name conflicts
     */
    SupplierDTO update(String id, SupplierDTO dto);

    /**
     * Deletes a supplier after verifying no linked inventory items exist.
     * @param id supplier ID to delete
     * @throws java.util.NoSuchElementException if supplier not found
     * @throws IllegalStateException if inventory items reference this supplier
     */
    void delete(String id);
}
