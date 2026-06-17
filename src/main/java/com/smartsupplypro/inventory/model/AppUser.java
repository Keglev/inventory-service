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
 * Represents an application user registered via OAuth2.
 *
 * <p>The email address serves as the unique login identifier.
 * Roles default to USER; an admin must manually promote to ADMIN.</p>
 *
 * @see Role
 */
@Getter
@Setter
@Entity(name = "UsersApp")
@Table(name = "users_app",
    uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email")
)
public class AppUser {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false, length = 16)
    private Role role = Role.USER;

    private LocalDateTime createdAt = LocalDateTime.now();

    public AppUser(String email, String name) {
        this.id = UUID.randomUUID().toString();
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();
    }

    // required by JPA
    public AppUser() {
        this.id = UUID.randomUUID().toString();
    }

    public Role getRoleEnum() {
        return this.role;
    }
}
