package com.smartsupplypro.inventory.service;

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
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOAuth2UserService}.
 *
 * <p><strong>Scope</strong>:</p>
 * <ul>
 *   <li>Exercise {@link CustomOAuth2UserService#loadUser(OAuth2UserRequest)} without hitting a real OAuth2 provider.</li>
 *   <li>Validate local user provisioning, role assignment, and role healing logic.</li>
 *   <li>Verify the resulting {@link org.springframework.security.oauth2.core.user.OAuth2User} has expected authorities
 *       and carries stable attributes (e.g., {@code email} and {@code appRole}).</li>
 * </ul>
 *
 * <p><strong>Why a unit test (not an integration test)</strong>:</p>
 * <ul>
 *   <li>The upstream provider user-info endpoint is network-bound and non-deterministic for CI.</li>
 *   <li>We override {@link CustomOAuth2UserService#loadFromProvider(OAuth2UserRequest)} to supply a deterministic
 *       {@link OAuth2User} stub, allowing us to test only our application logic.</li>
 * </ul>
 *
 * <p><strong>Behavior Coverage</strong>:</p>
 * <ul>
 *   <li><b>Missing email:</b> login is rejected with {@link OAuth2AuthenticationException}.</li>
 *   <li><b>Auto-provisioning:</b> when user is not found, create a new {@link AppUser} with role derived from
 *       {@code APP_ADMIN_EMAILS} allow-list.</li>
 *   <li><b>Race condition handling:</b> if a concurrent insert causes save to fail, retry via {@code findByEmail}.</li>
 *   <li><b>Role healing:</b> if stored role differs from desired role, persist the updated role.</li>
 * </ul>
 *
 * <p><strong>Environment Note</strong>:</p>
 * This service reads {@code APP_ADMIN_EMAILS} directly from the process environment. To keep tests stable across
 * developer machines/CI, these tests generate a random email that is extremely unlikely to be in the allow-list.
 */
class CustomOAuth2UserServiceTest {

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
        // Defensive: if a developer sets APP_ADMIN_EMAILS locally, avoid generating an email that flips isAdmin.
        Set<String> allow = currentAdminAllowlist();
        for (int i = 0; i < 50; i++) {
            String candidate = "user+" + UUID.randomUUID() + "@example.com";
            if (!allow.contains(candidate.toLowerCase())) return candidate;
        }
        // Extremely unlikely fallback; still produces a deterministic non-empty email.
        return "nonadmin@example.com";
    }

    private static OAuth2User oauthUserWithAttributes(Map<String, Object> attributes) {
        // Keep this stub permissive:
        // - DefaultOAuth2User enforces a nameAttributeKey to exist in attributes.
        // - Our service intentionally supports the "missing email" scenario (reject with exception),
        //   so we use a lightweight stub instead.
        return new OAuth2User() {
            @Override
            public Map<String, Object> getAttributes() {
                return attributes;
            }

            @Override
            public java.util.Collection<? extends GrantedAuthority> getAuthorities() {
                return Collections.singletonList(new SimpleGrantedAuthority("ROLE_OAUTH"));
            }

            @Override
            public String getName() {
                Object email = attributes.get("email");
                return email == null ? "unknown" : email.toString();
            }
        };
    }

    @Test
    void loadUser_throws_whenEmailMissing() {
        // Scenario: upstream provider does not supply an email attribute.
        // Expected: service rejects login (email is the principal) with OAuth2AuthenticationException.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = oauthUserWithAttributes(Map.of("name", "Alice"));

        CustomOAuth2UserService service = new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }
        };

        Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OAuth2UserRequest.class)))
            .isInstanceOf(OAuth2AuthenticationException.class)
            .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                Assertions.assertThat(ex.getError().getErrorCode()).contains("Email not provided"));
    }

    @Test
    void loadUser_createsUser_whenNotExists_andReturnsRoleUser() {
        // Scenario: first login for a non-admin email (not in APP_ADMIN_EMAILS allow-list).
        // Expected:
        //  - repository.save() is invoked once to auto-provision a local AppUser
        //  - role is USER and authority is ROLE_USER
        //  - "appRole" attribute is added for frontend consumption
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OAuth2User upstream = oauthUserWithAttributes(Map.of(
            "email", email,
            "name", "   " // cover fallback-to-email path
        ));

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }
        };

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        ArgumentCaptor<AppUser> savedCaptor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(savedCaptor.capture());
        AppUser saved = savedCaptor.getValue();

        Assertions.assertThat(saved.getEmail()).isEqualTo(email);
        Assertions.assertThat(saved.getName()).isEqualTo(email);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(saved.getCreatedAt()).isNotNull();

        Assertions.assertThat(result.getName()).isEqualTo(email);
        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(email);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");

        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(email);
    }

    @Test
    void loadUser_handlesRaceCondition_whenSaveFails_thenLoadsExistingUser() {
        // Scenario: user not found, service tries to auto-provision, but save fails due to a unique(email)
        // violation (another request inserted the user concurrently).
        // Expected: service recovers by re-loading via findByEmail and returns a valid ROLE_USER principal.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OAuth2User upstream = oauthUserWithAttributes(Map.of(
            "email", email,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Existing");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOAuth2UserService service = new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }
        };

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(email);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(email);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired() {
        // Scenario: existing user is stored with a role that no longer matches desired role.
        // Example: user was previously ADMIN, but email is not in APP_ADMIN_EMAILS allow-list anymore.
        // Expected: role is "healed" (updated and saved) and returned principal uses ROLE_USER.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OAuth2User upstream = oauthUserWithAttributes(Map.of(
            "email", email,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Alice");
        existing.setRole(Role.ADMIN); // should be healed to USER for non-admin email

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }
        };

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
        Mockito.verify(repo, Mockito.times(1)).findByEmail(email);
    }

    @Test
    void loadUser_doesNotPersist_whenExistingRoleAlreadyMatchesDesired() {
        // Scenario: existing user is found and the stored role already matches the desired role.
        // Enterprise rationale: avoid unnecessary writes during login (idempotent "role healing").
        // Expected: repository.save(...) is not called; returned principal still contains appRole and ROLE_USER.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        String email = nonAdminEmail();

        OAuth2User upstream = oauthUserWithAttributes(Map.of(
            "email", email,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(email);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(email)).thenReturn(Optional.of(existing));

        CustomOAuth2UserService service = new CustomOAuth2UserService(repo) {
            @Override
            protected OAuth2User loadFromProvider(OAuth2UserRequest request) {
                return upstream;
            }
        };

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(email);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(email);
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }
}
