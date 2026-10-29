package com.smartsupplypro.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartsupplypro.inventory.model.AppUser;

/**
 * Repository for {@link AppUser} persistence operations.
 *
 * <p>Provides email-based lookup for OAuth2 login and a user count
 * used to enforce the maximum-user registration limit.</p>
 *
 * @see AppUser
 */
public interface AppUserRepository extends JpaRepository<AppUser, String> {

    /**
     * Finds a user by sign-in email; login provisioning and {@code /api/me} use it.
     *
     * @param email the email the identity provider reports
     * @return the user, or empty if none is stored
     */
    Optional<AppUser> findByEmail(String email);

    @Override
    long count();
}
