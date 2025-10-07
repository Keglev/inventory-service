package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

/**
 * User entity for OAuth2 authentication and role-based access control.
 * Persisted in users_app table with Google email as unique identifier.
 *
 * <p><strong>Purpose</strong>: Tracks registered users, their roles (USER/ADMIN), and registration timestamps.
 *
 * <p><strong>Usage</strong>: Spring Security role checks, audit trails, API personalization.
 *
 * @see Role
 * @see <a href="../../../../../docs/architecture/patterns/model-patterns.md">Model Patterns</a>
 */
@Getter
@Setter
@Entity(name = "UsersApp")
@Table(name = "users_app",
    uniqueConstraints = @UniqueConstraint(name= "uk_users_email", columnNames = "email")
)
public class AppUser {

    /** Unique user ID (UUID format). */
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();
    
    /** Google email address (login ID). */
    @Column(unique = true, nullable = false)
    private String email;

    /** Full name from OAuth2 provider. */
    @Column(nullable = false)
    private String name;

    /** User role: USER or ADMIN (stored as STRING). */
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false, length = 16)
    private Role role = Role.USER; 

    /** Registration timestamp. */
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Creates new OAuth2 user with email and name.
     *
     * @param email Google email
     * @param name full name
     */
    public AppUser(String email, String name) {
        this.id = UUID.randomUUID().toString();
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();
    }

    /**
     * No-arg constructor for JPA.
     */
    public AppUser() {
        this.id = UUID.randomUUID().toString();
    }

    /**
     * Returns user's role enum.
     *
     * @return assigned role
     */
    public Role getRoleEnum() {
        return this.role;
    }

}
