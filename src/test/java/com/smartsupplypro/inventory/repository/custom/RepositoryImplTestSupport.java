package com.smartsupplypro.inventory.repository.custom;

import java.lang.reflect.Field;

import jakarta.persistence.EntityManager;

/**
 * Shared setup for the custom repository implementation tests, which build the
 * implementation by hand instead of letting Spring create it.
 */
final class RepositoryImplTestSupport {

    private RepositoryImplTestSupport() {}

    /**
     * Sets the {@code em} field that {@code @PersistenceContext} fills in production.
     * The implementations expose no setter or constructor for it, so the tests write
     * the private field directly.
     */
    static void injectEntityManager(Object target, EntityManager em) {
        try {
            Field f = target.getClass().getDeclaredField("em");
            f.setAccessible(true);
            f.set(target, em);
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException("Failed to inject EntityManager into repository under test", e);
        }
    }
}
