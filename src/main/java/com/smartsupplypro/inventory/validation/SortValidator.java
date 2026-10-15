package com.smartsupplypro.inventory.validation;

import org.springframework.data.core.PropertyPath;
import org.springframework.data.core.PropertyReferenceException;
import org.springframework.data.domain.Sort;

import com.smartsupplypro.inventory.exception.InvalidRequestException;

/**
 * Checks a client-supplied sort against the entity before the query runs.
 *
 * <p>Spring Data passes the {@code sort} request parameter to the query as
 * is. A property the entity does not have fails inside Hibernate as an
 * {@code InvalidDataAccessApiUsageException}, a framework type that also
 * covers genuine server faults, so it cannot be mapped to 400 safely. This
 * check turns the client mistake into the domain
 * {@link InvalidRequestException} instead.</p>
 */
public final class SortValidator {

    private SortValidator() {}

    /**
     * Rejects any sort order whose property path does not resolve on the entity.
     * Nested paths through associations (for example {@code supplier.name})
     * resolve and are accepted.
     *
     * @param sort       requested sort (may be unsorted)
     * @param entityType entity the query selects
     * @throws InvalidRequestException if a sort property is unknown
     */
    public static void requireKnownProperties(Sort sort, Class<?> entityType) {
        for (Sort.Order order : sort) {
            try {
                PropertyPath.from(order.getProperty(), entityType);
            } catch (PropertyReferenceException ex) {
                throw new InvalidRequestException("Unsupported sort property: " + order.getProperty());
            }
        }
    }
}
