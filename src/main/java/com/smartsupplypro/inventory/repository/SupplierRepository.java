package com.smartsupplypro.inventory.repository;

import com.smartsupplypro.inventory.model.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for {@link Supplier} aggregate.
 *
 * <p>Provides lookups required by the Supplier service and validator:
 * <ul>
 *   <li>Case-insensitive exact lookup for uniqueness checks</li>
 *   <li>Case-insensitive contains filter for search endpoint</li>
 * </ul>
 *
 * <p>Note: prefer returning {@code Optional<Supplier>} for exact lookups so the
 * service/validator can include/exclude the current id on update.
 */
@Repository
public interface SupplierRepository extends JpaRepository<Supplier, String> {

    /**
     * Case-insensitive exact match by name.
     * <p>Used for uniqueness checks.</p>
     *
     * @param name exact supplier name (case-insensitive)
     * @return optional supplier
     */
    Optional<Supplier> findByNameIgnoreCase(String name);

    /**
     * Case-insensitive substring search by name.
     * <p>Used by /search endpoint.</p>
     *
     * @param namePart substring to match (case-insensitive)
     * @return suppliers whose name contains the substring
     */
    List<Supplier> findByNameContainingIgnoreCase(String namePart);

    /**
     * Convenience exists check (optional). If you prefer/need it, keep it;
     * otherwise {@link #findByNameIgnoreCase(String)} is enough for uniqueness.
     *
     * @param name exact supplier name (case-insensitive)
     * @return true if a supplier with the name exists
     */
    boolean existsByNameIgnoreCase(String name);
}
