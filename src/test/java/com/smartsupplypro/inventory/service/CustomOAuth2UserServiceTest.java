package com.smartsupplypro.inventory.service;

import java.util.Map;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOAuth2UserService}.
 *
 * <p><strong>Scope</strong>:
 * Validate {@link CustomOAuth2UserService#loadUser(OAuth2UserRequest)} without contacting a real OAuth2 provider.
 * These tests focus on application-owned behavior (provisioning and role logic), not provider integration.
 *
 * <p><strong>Behavior Coverage</strong>:
 * <ul>
 *   <li><b>Email-based identity:</b> email is required; missing email rejects authentication.</li>
 *   <li><b>Auto-provisioning:</b> create a local {@link AppUser} on first login (with race-condition handling).</li>
 *   <li><b>Role assignment:</b> ADMIN vs USER derived from allow-list decision.</li>
 * </ul>
 *
 * <p><strong>Related coverage</strong>:
 * Role healing/idempotency scenarios are covered in {@link CustomOAuth2UserServiceRoleHealingTest}.
 *
 * <p><strong>Determinism</strong>:
 * Tests override {@link CustomOAuth2UserService#isAdminEmail(String)} through
 * {@link CustomUserServiceTestSupport#oauth2Service(AppUserRepository, OAuth2User, boolean)} so they do not depend
 * on {@code APP_ADMIN_EMAILS} in the running environment.
 */
class CustomOAuth2UserServiceTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void loadUser_throws_whenEmailMissing() {
        // Scenario: upstream provider does not supply an email attribute.
        // Expected: service rejects login (email is the principal) with OAuth2AuthenticationException.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of("name", "Alice"));
        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

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
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", USER_EMAIL,
            "name", "   " // cover fallback-to-email path
        ));

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        ArgumentCaptor<AppUser> savedCaptor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(savedCaptor.capture());
        AppUser saved = savedCaptor.getValue();

        Assertions.assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(saved.getCreatedAt()).isNotNull();

        Assertions.assertThat(result.getName()).isEqualTo(USER_EMAIL);
        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(USER_EMAIL);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");

        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_createsUser_whenAdminEmail_andReturnsRoleAdmin() {
        // Scenario: first login for an admin email.
        // Expected:
        //  - user is auto-provisioned with ADMIN role
        //  - authorities contain ROLE_ADMIN
        //  - appRole attribute is ADMIN
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", ADMIN_EMAIL
            // omit "name" to cover null-name fallback
        ));

        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, true);

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        ArgumentCaptor<AppUser> savedCaptor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(savedCaptor.capture());
        AppUser saved = savedCaptor.getValue();

        Assertions.assertThat(saved.getEmail()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.ADMIN);

        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("ADMIN");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_ADMIN");
    }

    @Test
    void loadUser_handlesRaceCondition_whenSaveFails_thenLoadsExistingUser() {
        // Scenario: user not found, service tries to auto-provision, but save fails due to a unique(email)
        // violation (another request inserted the user concurrently).
        // Expected: service recovers by re-loading via findByEmail and returns a valid ROLE_USER principal.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", USER_EMAIL,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Existing");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(USER_EMAIL);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_throws_whenSaveFails_andUserStillNotFound() {
        // Scenario: auto-provisioning fails due to a unique constraint, and the subsequent re-fetch still
        // returns empty (e.g., transient DB issue).
        // Expected: the original DataIntegrityViolationException is rethrown.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", USER_EMAIL,
            "name", "Alice"
        ));

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

        Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OAuth2UserRequest.class)))
            .isInstanceOf(DataIntegrityViolationException.class);

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
    }
}
