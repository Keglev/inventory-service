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
 * OAuth2 user service for social login with automatic role assignment.
 *
 * <p><strong>Characteristics</strong>:
 * <ul>
 *   <li><strong>Auto-Provisioning</strong>: Creates local user on first OAuth2 login</li>
 *   <li><strong>Role Assignment</strong>: ADMIN via APP_ADMIN_EMAILS env var, otherwise USER</li>
 *   <li><strong>Email-Based Identity</strong>: Uses email as principal for security context</li>
 *   <li><strong>Role Healing</strong>: Updates role if allow-list changes</li>
 * </ul>
 *
 * <p><strong>Configuration</strong>:
 * Set {@code APP_ADMIN_EMAILS} environment variable with comma-separated admin emails.
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

    /**
     * Reads admin email allow-list from APP_ADMIN_EMAILS environment variable.
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
     * Normalizes role name to Spring Security ROLE_* authority format.
     * @param roleName role name
     * @return ROLE_* prefixed authority
     */
    private static String toRoleAuthority(String roleName) {
        if (roleName == null || roleName.isBlank()) return "ROLE_USER";
        return roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
    }

    /**
     * Loads OAuth2 user and provisions/updates local user with role assignment.
     * @param request OAuth2 user request
     * @return OAuth2 user with ROLE_* authorities
     * @throws OAuth2AuthenticationException if email not provided
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        // Enterprise Comment: OAuth2 User Loading
        // Delegates to default service for upstream provider communication
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(request);

        final String email = oauthUser.getAttribute("email");
        final String name  = oauthUser.getAttribute("name");

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        // Enterprise Comment: Environment-Based Role Assignment
        // Admin emails configured via APP_ADMIN_EMAILS for operational flexibility
        // Decide role from env allow-list (minimal change; no AppProperties wiring needed)
        final boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());

        // Enterprise Comment: Auto-Provisioning Pattern
        // Creates local user on first login with race condition handling
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

        // Enterprise Comment: Role Healing Pattern
        // Updates role dynamically if allow-list changes (idempotent operation)
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
