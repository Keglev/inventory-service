package com.smartsupplypro.inventory.model;

/**
 * User role enum for authorization and access control via Spring Security.
 *
 * <p><strong>Roles</strong>: ADMIN (full CRUD access), USER (read-only access).
 *
 * <p><strong>Storage</strong>: Persisted as STRING via @Enumerated(EnumType.STRING).
 *
 * @see AppUser
 * @see <a href="../../../../../docs/architecture/patterns/model-patterns.md">Model Patterns</a>
 */
public enum Role {
    ADMIN,
    USER;

    /**
     * Parses string value to Role enum (trims whitespace, removes commas).
     *
     * @param value raw role name
     * @return corresponding Role enum
     * @throws IllegalArgumentException if invalid
     */
    public static Role fromString(String value) {
        return Role.valueOf(value.trim().replace(",", ""));
    }
}
