package com.smartsupplypro.inventory.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartsupplypro.inventory.model.Supplier;

/**
 * Repository for {@link Supplier} persistence operations.
 *
 * <p>Provides case-insensitive name lookups and existence checks
 * used for uniqueness validation before create and update operations.</p>
 *
 * @see Supplier
 * @see SupplierService
 */
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    Optional<Supplier> findByNameIgnoreCase(String name);

    List<Supplier> findByNameContainingIgnoreCase(String namePart);

    boolean existsByNameIgnoreCase(String name);
}
