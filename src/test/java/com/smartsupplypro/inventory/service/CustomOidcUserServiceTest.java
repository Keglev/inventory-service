package com.smartsupplypro.inventory.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOidcUserService}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Exercise {@link CustomOidcUserService#loadUser(OidcUserRequest)} without calling an actual OIDC provider.</li>
 *   <li>Validate auto-provisioning of {@link AppUser}, role assignment, and role healing for OIDC logins.</li>
 *   <li>Ensure the returned {@link OidcUser} has the expected role authority in addition to provider authorities.</li>
 * </ul>
 *
 * <p><strong>Why this is a unit test</strong>:</p>
 * <ul>
 *   <li>The default {@code OidcUserService} may call user-info endpoints and depends on provider configuration.</li>
 *   <li>We override {@link CustomOidcUserService#loadFromProvider(OidcUserRequest)} to provide a deterministic
 *       upstream {@link OidcUser}, then test only the application logic around provisioning and roles.</li>
 * </ul>
 *
 * <p><strong>Behavior Coverage</strong>:</p>
 * <ul>
 *   <li><b>Missing email:</b> reject authentication (email is the principal identity).</li>
 *   <li><b>Auto-provisioning:</b> create local user on first login with a role derived from {@code APP_ADMIN_EMAILS}.</li>
 *   <li><b>Race condition handling:</b> recover if {@code save} fails due to a unique(email) constraint.</li>
 *   <li><b>Role healing:</b> update persisted role if allow-list changed since last login.</li>
 * </ul>
 *
 * <p><strong>Environment Note</strong>:</p>
 * This service reads {@code APP_ADMIN_EMAILS} from process environment. To keep tests stable across machines/CI,
 * the tests generate a random email that is extremely unlikely to be present in the allow-list.
 */
class CustomOidcUserServiceTest {

    private static Set<String> currentAdminAllowlist() {
        // Mirrors service behavior: comma-separated values, trimmed, lowercased.
        String raw = System.getenv().getOrDefault("APP_ADMIN_EMAILS", "");
        if (raw == null || raw.isBlank()) return Collections.emptySet();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .map(String::toLowerCase)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static String nonAdminEmail() {
        // Defensive: avoid emails that might be configured as admin on a developer machine.
        Set<String> allow = currentAdminAllowlist();
        for (int i = 0; i < 50; i++) {
            String candidate = "user+" + UUID.randomUUID() + "@example.com";
            if (!allow.contains(candidate.toLowerCase())) return candidate;
        }
        return "nonadmin@example.com";
    }

    private static OidcUser upstreamOidcUser(String email, String fullName) {
        // Build a minimal-but-realistic OIDC principal.
        // The returned DefaultOidcUser provides getEmail()/getFullName() through OIDC claims.
        Map<String, Object> claims = Map.of(
            "sub", "sub-1",
            "email", email,
            "name", fullName
        );

        OidcIdToken idToken = new OidcIdToken(
            "dummy-token",
            Instant.now().minusSeconds(5),
            Instant.now().plusSeconds(3600),
            claims
        );

        OidcUserInfo userInfo = new OidcUserInfo(claims);

        return new DefaultOidcUser(
            Collections.singletonList(new SimpleGrantedAuthority("ROLE_OIDC")),
            idToken,
            userInfo,
            "email"
        );
    }

    @Test
    void loadUser_throws_whenEmailMissing() {
        // Scenario: provider does not supply an email claim.
        // Expected: service rejects authentication with OAuth2AuthenticationException.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = Mockito.mock(OidcUser.class);
        Mockito.when(upstream.getEmail()).thenReturn(null);
        Mockito.when(upstream.getFullName()).thenReturn("Alice");

        CustomOidcUserService service = new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }
        };

        Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OidcUserRequest.class)))
            .isInstanceOf(OAuth2AuthenticationException.class)
            .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                Assertions.assertThat(ex.getError().getErrorCode()).contains("Email not provided"));
    }

    @Test
    void loadUser_createsUser_whenNotExists_andAddsRoleUserAuthority() {
        // Scenario: first login for a non-admin user.
        // Expected:
        //  - AppUser is created (repo.save called once)
        //  - role is USER (ROLE_USER authority present)
        //  - principal name is email
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OidcUser upstream = upstreamOidcUser(email, "   ");

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }
        };

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(captor.capture());
        AppUser saved = captor.getValue();

        Assertions.assertThat(saved.getEmail()).isEqualTo(email);
        Assertions.assertThat(saved.getName()).isEqualTo(email);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);

        Assertions.assertThat(result.getName()).isEqualTo(email);
        Assertions.assertThat(result.getEmail()).isEqualTo(email);

        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");
    }

    @Test
    void loadUser_handlesRaceCondition_whenSaveFails_thenLoadsExistingUser() {
        // Scenario: concurrent login causes save to fail (unique(email) constraint).
        // Expected: service re-loads by email and continues with a valid ROLE_USER principal.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OidcUser upstream = upstreamOidcUser(email, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Existing");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOidcUserService service = new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }
        };

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(result.getEmail()).isEqualTo(email);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(email);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired() {
        // Scenario: stored role is ADMIN but desired role is USER (email not in allow-list anymore).
        // Expected: persisted role is updated and ROLE_USER authority is present.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OidcUser upstream = upstreamOidcUser(email, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Alice");
        existing.setRole(Role.ADMIN);

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }
        };

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
    }

    @Test
    void loadUser_doesNotPersist_whenExistingRoleAlreadyMatchesDesired_andPreservesProviderAuthorities() {
        // Scenario: existing user is found and already has the desired role.
        // Enterprise rationale: keep login idempotent (no-op "role healing") and avoid unnecessary writes.
        // Expected: repository.save(...) is not called; returned principal includes provider authorities AND ROLE_USER.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OidcUser upstream = upstreamOidcUser(email, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.of(existing));

        CustomOidcUserService service = new CustomOidcUserService(repo) {
            @Override
            protected OidcUser loadFromProvider(OidcUserRequest request) {
                return upstream;
            }
        };

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(result.getEmail()).isEqualTo(email);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(email);
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }
}
