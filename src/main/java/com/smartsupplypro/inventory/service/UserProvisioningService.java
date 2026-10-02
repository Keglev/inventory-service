package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Single source of truth for local user provisioning on OAuth2/OIDC login.
 *
 * <p>Finds or creates the {@link AppUser} for a verified identity, assigns
 * the role from the caller-supplied admin flag, and heals the stored role
 * when the admin allow-list has changed since the last login. Concurrent
 * first-logins from the same identity are resolved by catching the
 * unique-constraint violation and re-fetching the committed row.</p>
 *
 * @see CustomOidcUserService
 */
@Service
public class UserProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(UserProvisioningService.class);

    private final AppUserRepository userRepository;

    public UserProvisioningService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Finds or creates the local user for the given identity and heals the
     * stored role to match the admin allow-list.
     *
     * @param email   verified email from the identity provider (primary key)
     * @param name    display name from the provider (nullable; falls back to email)
     * @param isAdmin whether the email is on the admin allow-list
     * @return the persisted (and potentially role-healed) user
     */
    public AppUser provision(String email, String name, boolean isAdmin) {
        AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
            AppUser u = new AppUser();
            u.setEmail(email);
            u.setName((name == null || name.isBlank()) ? email : name);
            u.setRole(isAdmin ? Role.ADMIN : Role.USER);
            u.setCreatedAt(LocalDateTime.now());
            // Logs name the account by its id, never by its email: the privacy
            // page lists no personal data in application logs.
            try {
                AppUser created = userRepository.save(u);
                log.info("Created user account {}", created.getId());
                return created;
            } catch (DataIntegrityViolationException e) {
                // Concurrent first-login already created the row; re-fetch the winner
                AppUser winner = userRepository.findByEmail(email).orElseThrow(() -> e);
                log.warn("Concurrent user creation resolved to account {}", winner.getId());
                return winner;
            }
        });

        // Heal the stored role when the admin allow-list changed between logins
        Role desired = isAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() != desired) {
            user.setRole(desired);
            userRepository.save(user);
        }
        return user;
    }
}
