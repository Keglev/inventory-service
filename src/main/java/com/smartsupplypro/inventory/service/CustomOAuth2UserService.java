package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Default implementation of {@link OAuth2UserService} for social login
 * with automatic local user provisioning and role assignment.
 *
 * <p>Role is determined by the {@code APP_ADMIN_EMAILS} environment variable.
 * Role healing ensures the role stays in sync if the allow-list changes
 * between logins (idempotent operation).</p>
 *
 * @see AppUser
 * @see CustomOidcUserService
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final AppUserRepository userRepository;

    public CustomOAuth2UserService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private static Set<String> readAdminAllowlist() {
        String raw = System.getenv().getOrDefault("APP_ADMIN_EMAILS", "");
        return parseAdminAllowlist(raw);
    }

    static Set<String> parseAdminAllowlist(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toLowerCase)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    protected boolean isAdminEmail(String email) {
        return readAdminAllowlist().contains(email.toLowerCase());
    }

    private static String toRoleAuthority(String roleName) {
        if (roleName == null || roleName.isBlank()) return "ROLE_USER";
        return roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
    }

    /**
     * Loads the OAuth2 user, provisions a local account on first login,
     * and attaches a {@code ROLE_*} authority for downstream authorization.
     *
     * @param request OAuth2 user request
     * @return OAuth2 user with role-based authority and {@code appRole} attribute
     * @throws OAuth2AuthenticationException if the provider does not supply an email
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = loadFromProvider(request);

        String email = oauthUser.getAttribute("email");
        String name  = oauthUser.getAttribute("name");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        boolean isAdmin = isAdminEmail(email);
        AppUser user = provisionUser(email, name, isAdmin);

        String roleName = user.getRole().name();
        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("appRole", roleName);

        return new DefaultOAuth2User(
                Collections.singletonList(new SimpleGrantedAuthority(toRoleAuthority(roleName))),
                attributes,
                "email"
        );
    }

    /**
     * Finds or creates the local {@link AppUser} for the given OAuth2 identity,
     * and heals the role if the allow-list has changed since the last login.
     *
     * <p>Concurrent first-logins from the same identity are resolved by catching
     * the unique-constraint violation and re-fetching the row the winning thread committed.</p>
     *
     * @param email   verified email from the OAuth2 provider
     * @param name    display name from the OAuth2 provider (nullable)
     * @param isAdmin whether the email is on the admin allow-list
     * @return the persisted (and potentially role-healed) user
     */
    private AppUser provisionUser(String email, String name, boolean isAdmin) {
        AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
            AppUser u = new AppUser();
            u.setEmail(email);
            u.setName((name == null || name.isBlank()) ? email : name);
            u.setRole(isAdmin ? Role.ADMIN : Role.USER);
            u.setCreatedAt(LocalDateTime.now());
            try {
                return userRepository.save(u);
            } catch (DataIntegrityViolationException e) {
                // Another concurrent request already created the user — re-fetch by email
                return userRepository.findByEmail(email).orElseThrow(() -> e);
            }
        });

        // Keep role in sync when APP_ADMIN_EMAILS changes between logins
        Role desired = isAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() != desired) {
            user.setRole(desired);
            userRepository.save(user);
        }
        return user;
    }

    /**
     * Loads the user from the upstream OAuth2 provider.
     * Extracted for testability — tests override this to avoid network calls.
     */
    protected OAuth2User loadFromProvider(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        return new DefaultOAuth2UserService().loadUser(request);
    }
}
