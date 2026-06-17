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
 * Provisions local user accounts on first OAuth2 login.
 *
 * <p>Extracted from
 * {@link com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler}
 * to keep that handler focused on authentication flow coordination.
 * Role defaults to {@link Role#USER}; admin promotion is handled separately
 * by {@link CustomOAuth2UserService} via the {@code APP_ADMIN_EMAILS} allow-list.</p>
 *
 * @see CustomOAuth2UserService
 * @see com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler
 */
@Service
public class UserProvisioningService {

    private static final Logger log = LoggerFactory.getLogger(UserProvisioningService.class);

    private final AppUserRepository userRepository;

    public UserProvisioningService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Creates a local user account for the given OAuth2 identity if one does not already exist.
     *
     * <p>Concurrent creation races — triggered by simultaneous first-logins from the same
     * identity — are resolved via a {@link DataIntegrityViolationException} fallback that
     * re-fetches the row committed by the winning thread.</p>
     *
     * @param email user's email address, used as primary key
     * @param name  display name from the OAuth2 provider
     * @throws IllegalStateException if a concurrent creation race cannot be resolved
     */
    public void provisionIfAbsent(String email, String name) {
        try {
            userRepository.findById(email).orElseGet(() -> {
                log.info("Creating new user account: {}", email);
                AppUser newUser = new AppUser(email, name);
                newUser.setRole(Role.USER);
                newUser.setCreatedAt(LocalDateTime.now());
                return userRepository.save(newUser);
            });
        } catch (DataIntegrityViolationException e) {
            // Race condition: concurrent first-login from the same identity
            log.warn("Concurrent user creation resolved for: {}", email);
            userRepository.findByEmail(email).orElseThrow(() ->
                new IllegalStateException("User already exists but cannot be loaded."));
        }
    }
}
