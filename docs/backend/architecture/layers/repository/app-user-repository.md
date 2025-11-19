[⬅️ Back to Layers Overview](./index.md)

# App User Repository

## Purpose

Data access for AppUser entities. Manages OAuth2 users and authentication principals for role-based access control.

## Interface Methods

```java
Optional<AppUser> findByEmail(String email);
Optional<AppUser> findByOAuth2Id(String oauth2Id);
AppUser save(AppUser entity);
boolean existsByEmail(String email);
```

## Database Table

**Table Name:** `APP_USER`

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| ID | UUID | PK | User identifier |
| EMAIL | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| OAUTH2_ID | VARCHAR(255) | | OAuth2 provider ID |
| NAME | VARCHAR(255) | | Display name |
| ROLE | VARCHAR(20) | NOT NULL | User role (ADMIN, USER) |
| CREATED_AT | TIMESTAMP | NOT NULL | Account creation |
| LAST_LOGIN | TIMESTAMP | | Last login time |

---

[⬅️ Back to Layers Overview](./index.md)
