package com.smartsupplypro.inventory.model;

import java.time.LocalDateTime;
import java.util.UUID;

// import com.smartsupplypro.inventory.converter.RoleConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
// import jakarta.persistence.Convert;
import lombok.Getter;
import lombok.Setter;


@Getter
@Setter
@Entity(name = "UsersApp")
@Table(name = "USERS_APP", schema = "ADMIN")
public class AppUser {

    @Id
    @Column(length = 36)
    private String id = UUID.randomUUID().toString();

    @Column(unique = true, nullable = false)
    private String email;

    private String name;

    // @Convert(converter = RoleConverter.class)
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE")
    private Role role;

    private LocalDateTime createdAt = LocalDateTime.now();

    public AppUser(String email, String name) {
        this.id = UUID.randomUUID().toString();
        this.email = email;
        this.name = name;
        this.createdAt = LocalDateTime.now();
        System.out.println(">>> AppUser constructor: email=" + email + ", role=" + role);
    }
    public AppUser() {
        // Default constructor for JPA
        this.id = UUID.randomUUID().toString();
    }
    // getters/setters
     public Role getRoleEnum() {
        return this.role;
    }
    static {
         System.out.println(">>> ENUM CLASS = " + Role.class.getName());
        System.out.println(">>> LOADED FROM = " + Role.class.getResource("/" + Role.class.getName().replace('.', '/') + ".class"));
        for (Role r : Role.values()) {
            System.out.println(">>> Role enum value: " + r.name());
        }
    }
}

