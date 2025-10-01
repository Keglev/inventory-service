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
 * Custom OIDC user service that runs for providers sending the "openid" scope (e.g., Google).
 *
 * <p><b>Why we need this:</b> For OIDC logins Spring Security invokes an {@link OAuth2UserService}
 * parametrized as {@code OAuth2UserService<OidcUserRequest, OidcUser>} rather than the plain
 * {@code OAuth2UserService<OAuth2UserRequest, OAuth2User>}. If we only customize the latter,
 * our role mapping (ROLE_USER / ROLE_ADMIN) never runs, resulting in requests that carry only
 * authorities like {@code OIDC_USER} and scopes, but <em>not</em> {@code ROLE_ADMIN}.</p>
 *
 * <p>This implementation delegates to the default {@link OidcUserService} to load the upstream
 * OIDC user, then:
 * <ol>
 *   <li>Reads the user's email from OIDC claims.</li>
 *   <li>Finds/creates a local {@link AppUser} record and assigns {@code Role.ADMIN} when the
 *       email is present in the environment variable {@code APP_ADMIN_EMAILS}
 *       (comma-separated, case-insensitive); otherwise {@code Role.USER}.</li>
 *   <li>Builds a {@link DefaultOidcUser} that <b>adds</b> {@code ROLE_*} to the provider
 *       authorities and uses the email as the principal name attribute.</li>
 * </ol>
 * Keeping the principal name as the email ensures logs and security traces show the email
 * instead of the OIDC subject ("sub").</p>
 */
@Service
public class CustomOidcUserService implements OAuth2UserService<OidcUserRequest, OidcUser> {

    private final AppUserRepository userRepository;

    public CustomOidcUserService(AppUserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Reads APP_ADMIN_EMAILS (comma-separated, case-insensitive) into a lowercase set. */
    private static Set<String> readAdminAllowlist() {
        String raw = System.getenv().getOrDefault("APP_ADMIN_EMAILS", "");
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toLowerCase)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static String toRoleAuthority(Role role) {
        String name = (role == null) ? "USER" : role.name();
        return name.startsWith("ROLE_") ? name : "ROLE_" + name;
    }

    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        // Delegate to the default loader first
        OidcUser oidc = new OidcUserService().loadUser(request);

        final String email = oidc.getEmail(); // same as oidc.getAttribute("email")
        final String name  = oidc.getFullName(); // falls back to "name" claim if present

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider.");
        }

        // Decide role from env allow-list (same helper you already use)
        final boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());

        // ---- FIND OR CREATE BY *EMAIL* (not by id) ----
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

        // Heal role if the allow-list changed since last login
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
