[⬅️ Back to Model Index](./index.md)

# App User Entity

**Purpose:** OAuth2 user principal with authentication and authorization

**Database Table:** `APP_USER`

## Entity Definition

```java
@Entity
@Table(name = "APP_USER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {
    
    @Id
    @Column(name = "ID", nullable = false)
    private String id;  // UUID
    
    @Column(name = "EMAIL", nullable = false, unique = true)
    private String email;  // OAuth2 email (unique identifier)
    
    @Column(name = "OAUTH2_ID")
    private String oauth2Id;  // OAuth2 provider ID (Google, GitHub, etc.)
    
    @Column(name = "NAME")
    private String name;  // Display name
    
    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false)
    private Role role;  // ADMIN or USER
    
    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "LAST_LOGIN")
    private LocalDateTime lastLogin;  // Updated on each authentication
}
```

## Business Rules

1. **Unique Email:** User email must be unique - single email per account
2. **Required Role:** Every user must have assigned role (ADMIN or USER)
3. **Role Determines Permissions:** Role controls system access levels
4. **Immutable Creation:** Creation timestamp cannot be modified
5. **OAuth2 Integration:** Works seamlessly with Google, GitHub, and other OAuth2 providers
6. **Auto-Provisioning:** Users are created automatically on first OAuth2 login

## Key Features

- **OAuth2 Integration:** Supports multiple OAuth2 providers (Google, GitHub, etc.)
- **Role-Based Access Control:** ADMIN vs USER differentiation for permissions
- **Timestamp Tracking:** Records creation and last login times
- **Email as Unique Identifier:** Email uniqueness ensures proper user identification
- **No Password Storage:** OAuth2 eliminates password management complexity

---

[⬅️ Back to Model Index](./index.md)
