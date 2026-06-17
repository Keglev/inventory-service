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

    Optional<AppUser> findByEmail(String email);

    @Override
    long count();
}
