package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(CustomOidcUserService.class);

    private final AppUserRepository userRepository;
    private final OidcUserService delegate = new OidcUserService();

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
        return "ROLE_" + (role == null ? Role.USER.name() : role.name());
    }

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        // 1) Load provider user (ID token + optional userinfo + default authorities)
        OidcUser oidcUser = delegate.loadUser(userRequest);

        // 2) Extract email / name from OIDC claims
        final String email = (String) oidcUser.getAttributes().get("email");
        final String name  = (String) oidcUser.getAttributes().getOrDefault("name", email);
        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("OIDC provider did not supply an email claim.");
        }

        // 3) Map to local AppUser + decide role from allow-list
        final boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());
        AppUser user = userRepository.findById(email).orElseGet(() -> {
            AppUser u = new AppUser(email, (name == null || name.isBlank()) ? email : name);
            u.setRole(isAdmin ? Role.ADMIN : Role.USER);
            u.setCreatedAt(LocalDateTime.now());
            try {
                return userRepository.save(u);
            } catch (DataIntegrityViolationException e) {
                return userRepository.findById(email).orElseThrow(() -> e);
            }
        });

        Role desired = isAdmin ? Role.ADMIN : Role.USER;
        if (user.getRole() != desired) {
            user.setRole(desired);
            userRepository.save(user);
        }

        // 4) Merge authorities (keep provider authorities + add ROLE_*)
        List<GrantedAuthority> authorities = new ArrayList<>(oidcUser.getAuthorities());
        authorities.add(new SimpleGrantedAuthority(toRoleAuthority(user.getRole())));

        // 5) Build a new OidcUser using email as the name attribute key
        OidcUser mapped = (oidcUser.getUserInfo() != null)
            ? new DefaultOidcUser(authorities, oidcUser.getIdToken(), oidcUser.getUserInfo(), "email")
            : new DefaultOidcUser(authorities, oidcUser.getIdToken(), "email");

        log.info("OIDC login: email={} assignedRole={} authorities={}",
                email, user.getRole().name(),
                authorities.stream().map(GrantedAuthority::getAuthority).sorted().toList());

        return mapped;
    }
}
