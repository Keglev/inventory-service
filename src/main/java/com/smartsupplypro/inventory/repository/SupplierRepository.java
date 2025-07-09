package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for managing {@link Supplier} entities.
 *
 * <p>This interface provides data access methods for querying suppliers,
 * including name-based search and duplicate checks. It supports the Supplier
 * management UI, validation routines, and backend analytics filters.
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    /**
     * Searches suppliers by partial, case-insensitive name match.
     *
     * <p>Useful for UI auto-complete features and flexible filter interfaces.
     *
     * @param name the partial name to match (case-insensitive)
     * @return list of suppliers whose names contain the given substring
     */
    List<Supplier> findByNameContainingIgnoreCase(String name);

    /**
     * Checks if a supplier with the given name already exists (case-insensitive).
     *
     * <p>Used to enforce uniqueness constraints in validation and form submissions.
     *
     * @param name the supplier name to check
     * @return true if a supplier with the given name exists, false otherwise
     */
    boolean existsByNameIgnoreCase(String name);
}
