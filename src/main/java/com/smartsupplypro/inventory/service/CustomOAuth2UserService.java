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
 * OAuth2 user service that:
 *
 * <ul>
 *   <li>Loads the upstream OAuth2 user (e.g., Google) and extracts email/name.</li>
 *   <li>Finds or creates a local {@link AppUser} record on first login.</li>
 *   <li>Assigns {@code ROLE_ADMIN} if the user's email is present in the configured allow-list
 *       (environment variable {@code APP_ADMIN_EMAILS}, comma-separated, case-insensitive);
 *       otherwise assigns {@code ROLE_USER}.</li>
 *   <li>Exposes a Spring Security authority of the form {@code ROLE_*} so that
 *       {@code hasRole('ADMIN')} and {@code hasRole('USER')} continue to work unchanged.</li>
 *   <li>Adds an {@code appRole} attribute to the principal's attributes for frontend display if needed.</li>
 * </ul>
 *
 * <p><strong>Rationale:</strong> This keeps your existing controller annotations and tests intact.
 * You can grant yourself (or others) admin rights operationally via an environment variable,
 * avoiding hard-coding emails in source code.</p>
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final AppUserRepository userRepository;

    public CustomOAuth2UserService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Reads a comma-separated admin list from {@code APP_ADMIN_EMAILS}.
     * Trims whitespace and lower-cases entries for case-insensitive matching.
     */
    private static Set<String> readAdminAllowlist() {
        String raw = System.getenv().getOrDefault("APP_ADMIN_EMAILS", "");
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toLowerCase)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    /** Normalizes a role name to a Spring Security ROLE_* authority. */
    private static String toRoleAuthority(String roleName) {
        if (roleName == null || roleName.isBlank()) return "ROLE_USER";
        return roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(request);

        final String email = oauthUser.getAttribute("email");
        final String name  = oauthUser.getAttribute("name");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        // Decide role from env allow-list (minimal change; no AppProperties wiring needed)
        final boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());

        // Find or create local user
        AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
            AppUser u = new AppUser();                           // use no-arg ctor; id stays a UUID
            u.setEmail(email);
            u.setName((name == null || name.isBlank()) ? email : name);
            u.setRole(isAdmin ? Role.ADMIN : Role.USER);
            u.setCreatedAt(LocalDateTime.now());
            try {
                return userRepository.save(u);
            } catch (DataIntegrityViolationException e) {
                // If unique(email) tripped, fetch the existing row by EMAIL
                return userRepository.findByEmail(email).orElseThrow(() -> e);
            }
        });

        // Heal role if the allow-list changed since last login (idempotent)
        final Role desired = isAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() != desired) {
            user.setRole(desired);
            userRepository.save(user);
        }

        // Build ROLE_* authority so hasRole(...) checks keep working
        final String roleName = user.getRole().name();
        final SimpleGrantedAuthority roleAuthority = new SimpleGrantedAuthority(toRoleAuthority(roleName));

        // Copy provider attributes and add a helpful "appRole" for the frontend
        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("appRole", roleName);

        return new DefaultOAuth2User(Collections.singletonList(roleAuthority), attributes, "email");
    }
}
