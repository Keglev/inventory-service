package com.smartsupplypro.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartsupplypro.inventory.model.Supplier;

/**
 * Repository for {@link Supplier} persistence operations.
 *
 * <p>Provides the case-insensitive exact-name lookup that backs the uniqueness
 * check before create and update.</p>
 *
 * @see Supplier
 * @see SupplierService
 */
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    /**
     * Finds a supplier by exact name, ignoring case; the uniqueness check before
     * create and update uses it.
     *
     * @param name supplier name
     * @return the supplier, or empty
     */
    Optional<Supplier> findByNameIgnoreCase(String name);
}
