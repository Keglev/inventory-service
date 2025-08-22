package com.smartsupplypro.inventory.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smartsupplypro.inventory.model.AppUser;

/**
 * Repository interface for managing {@link AppUser} entities.
 *
 * <p>Extends {@link JpaRepository} to provide CRUD operations and
 * query support for application users who authenticate via OAuth2.
 *
 * <p>This repository is primarily used for:
 * <ul>
 *   <li>Fetching users by email (OAuth2 identifier)</li>
 *   <li>Counting total registered users (enforces max-user limits)</li>
 * </ul>
 */
public interface AppUserRepository extends JpaRepository<AppUser, String> {

    /**
     * Finds an application user by their email address.
     * Used during OAuth2 login to resolve users from the database.
     *
     * @param email the user's email (must match exact case)
     * @return Optional containing the user if found, or empty otherwise
     */
    Optional<AppUser> findByEmail(String email);

    /**
     * Returns the total number of registered users.
     * Useful for enforcing a maximum number of allowed users.
     *
     * @return user count
     */
    @Override
    long count();
}
// This interface provides methods to interact with the AppUser entity in the database.
