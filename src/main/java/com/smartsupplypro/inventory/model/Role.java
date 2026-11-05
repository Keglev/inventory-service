package com.smartsupplypro.inventory.model;

/**
 * User role enum for authorization and access control via Spring Security.
 *
 * <p><strong>Roles</strong>: ADMIN (full CRUD access), USER (reads, plus quantity and
 * price adjustments).
 *
 * <p><strong>Storage</strong>: Persisted as STRING via @Enumerated(EnumType.STRING).
 *
 * @see AppUser
 */
public enum Role {
    ADMIN,
    USER
}
