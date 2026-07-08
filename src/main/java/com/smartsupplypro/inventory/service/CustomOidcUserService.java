package com.smartsupplypro.inventory.service;

import java.util.Arrays;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

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

    private final UserProvisioningService userProvisioningService;

    public CustomOidcUserService(UserProvisioningService userProvisioningService) {
        this.userProvisioningService = userProvisioningService;
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

        AppUser user = userProvisioningService.provision(email, name, isAdminEmail(email));

        List<GrantedAuthority> authorities = new ArrayList<>(oidc.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(toRoleAuthority(user.getRole())));

        // Email is used as the principal name so SecurityContext and logs show the user's email
        return new DefaultOidcUser(authorities, oidc.getIdToken(), oidc.getUserInfo(), "email");
    }

    /**
     * Loads the user from the upstream OIDC provider.
     * Extracted for testability — tests override this to avoid network calls.
     */
    protected OidcUser loadFromProvider(OidcUserRequest request) throws OAuth2AuthenticationException {
        return new OidcUserService().loadUser(request);
    }
}
