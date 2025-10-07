package com.smartsupplypro.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartsupplypro.inventory.model.AppUser;

/**
 * Repository for OAuth2 application user management.
 *
 * <p><strong>Capabilities</strong>:
 * <ul>
 *   <li><strong>User Lookup</strong>: Find by email (OAuth2 identifier)</li>
 *   <li><strong>User Count</strong>: Total registered users (enforces max-user limits)</li>
 * </ul>
 *
 * @see AppUser
 * @see CustomOAuth2UserService
 * @see <a href="file:../../../../../../docs/architecture/patterns/repository-patterns.md">Repository Patterns</a>
 */
public interface AppUserRepository extends JpaRepository<AppUser, String> {

    /**
     * Finds user by email address (used during OAuth2 login).
     *
     * @param email user's email
     * @return user if found, empty otherwise
     */
    Optional<AppUser> findByEmail(String email);

    /**
     * Returns total registered user count (KPI).
     *
     * @return user count
     */
    @Override
    long count();
}

