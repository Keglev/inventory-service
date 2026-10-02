package com.smartsupplypro.inventory.model;

/**
 * User role enum for authorization and access control via Spring Security.
 *
 * <p><strong>Roles</strong>: ADMIN (full CRUD access), USER (read-only access).
 *
 * <p><strong>Storage</strong>: Persisted as STRING via @Enumerated(EnumType.STRING).
 *
 * @see AppUser
 */
public enum Role {
    ADMIN,
    USER
}
