package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * OIDC user service for OpenID Connect providers with automatic role assignment.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>OIDC Support</strong>: Handles OpenID Connect flow (e.g., Google with openid scope)</li>
 *   <li><strong>Auto-Provisioning</strong>: Creates local user on first OIDC login</li>
 *   <li><strong>Role Assignment</strong>: ADMIN via APP_ADMIN_EMAILS env var, otherwise USER</li>
 *   <li><strong>Email-Based Identity</strong>: Uses email as principal for security context</li>
 *   <li><strong>Role Healing</strong>: Updates role if allow-list changes</li>
 * </ul>
 *
 * <p><strong>Why Separate from OAuth2UserService</strong>:
 * OIDC requires {@code OAuth2UserService<OidcUserRequest, OidcUser>} parametrization.
 * Without this, role mapping ({@code ROLE_ADMIN}/{@code ROLE_USER}) wouldn't apply to OIDC logins.
 *
 * <p><strong>Configuration</strong>:
 * Set {@code APP_ADMIN_EMAILS} environment variable with comma-separated admin emails.
 *
 * @see AppUser
 * @see CustomOAuth2UserService
 */
@Service
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final AppUserRepository userRepository;

    public CustomOidcUserService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Reads admin allow-list from APP_ADMIN_EMAILS environment variable.
     *
     * @return set of lowercase admin emails
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

    /**
     * Normalizes role to Spring Security authority format.
     *
     * @param role user role
     * @return ROLE_* authority string
     */
    private static String toRoleAuthority(Role role) {
        String name = (role == null) ? "USER" : role.name();
        return name.startsWith("ROLE_") ? name : "ROLE_" + name;
    }

    /**
     * Loads OIDC user and assigns ROLE_ADMIN or ROLE_USER based on APP_ADMIN_EMAILS.
     *
     * @param request OIDC user request
     * @return OIDC user with role-based authority
     * @throws OAuth2AuthenticationException if email missing or user creation fails
     */
    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        // Enterprise Comment: OIDC User Loading
        // Delegate to OidcUserService to handle ID token validation and claims extraction.
        // This ensures OpenID Connect standards (JWT signature, issuer validation, nonce) are enforced.
        OidcUser oidc = new OidcUserService().loadUser(request);

        final String email = oidc.getEmail(); // same as oidc.getAttribute("email")
        final String name  = oidc.getFullName(); // falls back to "name" claim if present

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        // Enterprise Comment: Environment-Based Role Assignment
        // APP_ADMIN_EMAILS allows zero-downtime role changes without code deployment.
        // Example: APP_ADMIN_EMAILS=admin@corp.com,manager@corp.com
        final boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());

        // Enterprise Comment: Auto-Provisioning Pattern
        // Create user on first login with role based on email allow-list.
        // Race condition handling: If concurrent login creates duplicate, re-fetch by email.
        AppUser user = userRepository.findByEmail(email).orElseGet(() -> {
            AppUser u = new AppUser();                           // let JPA manage UUID id
            u.setEmail(email);
            u.setName((name == null || name.isBlank()) ? email : name);
            u.setRole(isAdmin ? Role.ADMIN : Role.USER);
            u.setCreatedAt(LocalDateTime.now());
            try {
                return userRepository.save(u);
            } catch (DataIntegrityViolationException e) {
                // Another request created it concurrently, or it already existed -> re-fetch by EMAIL
                return userRepository.findByEmail(email).orElseThrow(() -> e);
            }
        });

        // Enterprise Comment: Role Healing Pattern
        // Update role if APP_ADMIN_EMAILS changed since last login (idempotent operation).
        final Role desired = isAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() != desired) {
            user.setRole(desired);
            userRepository.save(user);
        }

        // Merge ROLE_* into authorities so hasRole(...) works across the app
        var authorities = new java.util.ArrayList<GrantedAuthority>(oidc.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(toRoleAuthority(user.getRole())));

        // Prefer "email" as the principal name (so logs & SecurityContext name show the email)
        return new DefaultOidcUser(
            authorities,
            oidc.getIdToken(),
            oidc.getUserInfo(),
            "email"
        );
    }
}
