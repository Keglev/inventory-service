package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for supplier aggregate management.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>Uniqueness Checks</strong>: Case-insensitive name lookup for validation</li>
 *   <li><strong>Search</strong>: Case-insensitive substring matching for search endpoint</li>
 *   <li><strong>Existence Checks</strong>: Optional helper for uniqueness validation</li>
 * </ul>
 *
 * @see Supplier
 * @see SupplierService
 * @see <a href="file:../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    /**
     * Finds supplier by exact name (case-insensitive).
     *
     * @param name supplier name
     * @return supplier if found, empty otherwise
     */
    Optional<Supplier> findByNameIgnoreCase(String name);

    /**
     * Searches suppliers by name substring (case-insensitive).
     *
     * @param namePart substring to match
     * @return matching suppliers
     */
    List<Supplier> findByNameContainingIgnoreCase(String namePart);

    /**
     * Checks if supplier exists by name (case-insensitive).
     *
     * @param name supplier name
     * @return true if exists
     */
    boolean existsByNameIgnoreCase(String name);
}
