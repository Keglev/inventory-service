package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
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
 * Default implementation of {@link OAuth2UserService} for OpenID Connect providers,
 * with automatic local user provisioning and role assignment.
 *
 * <p>A separate OIDC-specific service is required because the {@code OidcUserRequest}
 * and {@code OidcUser} type parameters differ from the plain OAuth2 variants, so
 * role mapping would not apply to OIDC logins without this class.</p>
 *
 * <p>Role is determined by the {@code APP_ADMIN_EMAILS} environment variable.
 * Role healing keeps the role in sync if the allow-list changes between logins.</p>
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

    private static String toRoleAuthority(Role role) {
        String name = (role == null) ? "USER" : role.name();
        return name.startsWith("ROLE_") ? name : "ROLE_" + name;
    }

    /**
     * Loads the OIDC user, provisions a local account on first login, and merges
     * a {@code ROLE_*} authority so {@code hasRole()} checks work across the app.
     *
     * @param request OIDC user request
     * @return OIDC user with role-based authority
     * @throws OAuth2AuthenticationException if the provider does not supply an email
     */
    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser oidc = loadFromProvider(request);

        String email = oidc.getEmail();
        String name  = oidc.getFullName();

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        boolean isAdmin = isAdminEmail(email);
        AppUser user = provisionUser(email, name, isAdmin);

        List<GrantedAuthority> authorities = new ArrayList<>(oidc.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(toRoleAuthority(user.getRole())));

        // Email is used as the principal name so SecurityContext and logs show the user's email
        return new DefaultOidcUser(authorities, oidc.getIdToken(), oidc.getUserInfo(), "email");
    }

    /**
     * Finds or creates the local {@link AppUser} for the given OIDC identity,
     * and heals the role if the allow-list has changed since the last login.
     *
     * <p>Concurrent first-logins from the same identity are resolved by catching
     * the unique-constraint violation and re-fetching the row the winning thread committed.</p>
     *
     * @param email   verified email from the OIDC provider
     * @param name    display name from the OIDC provider (nullable)
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
     * Loads the user from the upstream OIDC provider.
     * Extracted for testability — tests override this to avoid network calls.
     */
    protected OidcUser loadFromProvider(OidcUserRequest request) throws OAuth2AuthenticationException {
        return new OidcUserService().loadUser(request);
    }
}
