package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.Getter;
import lombok.Setter;

/**
 * Entity representing a registered user authenticated via Google OAuth2.
 *
 * <p>This user model is persisted in the Oracle Autonomous Database under
 * the table {@code ADMIN.USERS_APP}. It tracks the user's identity,
 * role (USER or ADMIN), and registration timestamp.
 *
 * <p>Roles are assigned based on email domains or post-login business logic.
 *
 * <p>Example usage:
 * <ul>
 *   <li>Access control via Spring Security role checks</li>
 *   <li>Audit trails for changes made by a user</li>
 *   <li>API personalization (e.g., showing user's own updates)</li>
 * </ul>
 */
@Getter
@Setter
@Entity(name = "UsersApp")
@Table(
    name = "users_app", 
    // schema = "$(USERS_SCHEMA:ADMIN)",
    uniqueConstraints = @UniqueConstraint(name= "uk_users_email", columnNames = "email")
)
public class AppUser {

    /** Unique internal user ID (UUID format) */
    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    /** User's Google email address (used as login ID) */
    @Column(unique = true, nullable = false)
    private String email;

    /** Full name as retrieved from OAuth2 provider */
    private String name;

    /** Role of the user: USER or ADMIN (stored as STRING in DB) */
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE")
    private Role role;

    /** Timestamp when the user was registered in the system */
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Constructor used when registering a new OAuth2 user.
     * Automatically sets ID and creation timestamp.
     *
     * @param email Google email
     * @param name Full name
     */
    public AppUser(String email, String name) {
        this.id = UUID.randomUUID().toString();
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();

        // For debugging only — remove in production
        System.out.println(">>> AppUser constructor: email=" + email + ", role=" + role);
    }

    /**
     * Required by JPA for reflective instantiation.
     */
    public AppUser() {
        this.id = UUID.randomUUID().toString();
    }

    /**
     * Returns the user's role enum for programmatic logic.
     *
     * @return assigned {@link Role}
     */
    public Role getRoleEnum() {
        return this.role;
    }

    // Static block is primarily for debug purposes (can be removed)
    static {
        System.out.println(">>> ENUM CLASS = " + Role.class.getName());
        System.out.println(">>> LOADED FROM = " + Role.class.getResource("/" + Role.class.getName().replace('.', '/') + ".class"));
        for (Role r : Role.values()) {
            System.out.println(">>> Role enum value: " + r.name());
        }
    }
}
/**
 * Enum representing user roles in the application.
 *
 * <p>Roles are used for access control and authorization checks.
 * The default role is USER, with ADMIN having elevated privileges.
 */