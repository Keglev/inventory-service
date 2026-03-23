package com.smartsupplypro.inventory.service;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOidcUserService}.
 * <p><strong>Scope</strong>: Validate {@link CustomOidcUserService#loadUser(OidcUserRequest)} without contacting a real
 * provider. These tests focus on application-owned behavior (provisioning and role logic), not provider integration.
 * <p><strong>Behavior Coverage</strong>:
 * <ul>
 *   <li><b>Email-based identity:</b> email is required; missing email rejects authentication.</li>
 *   <li><b>Auto-provisioning:</b> create a local {@link AppUser} on first login (with race-condition handling).</li>
 *   <li><b>Authority merging:</b> preserve provider authorities and add the application role.</li>
 * </ul>
 * <p><strong>Related coverage</strong>: Role healing/idempotency scenarios are covered in
 * {@link CustomOidcUserServiceRoleHealingTest}.
 * <p><strong>Determinism</strong>: tests use {@link CustomUserServiceTestSupport#oidcService(AppUserRepository, OidcUser,
 * boolean)} to override {@link CustomOidcUserService#isAdminEmail(String)} so they do not depend on
 * {@code APP_ADMIN_EMAILS} in the running environment.
 */
class CustomOidcUserServiceTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void loadUser_throws_whenEmailMissing() {
        // Scenario: provider does not supply an email claim. Expected: reject authentication.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = mock(OidcUser.class);
        when(upstream.getEmail()).thenReturn(null);
        when(upstream.getFullName()).thenReturn("Alice");
        CustomOidcUserService service = service(repo, upstream, false);
        Assertions.assertThatThrownBy(() -> service.loadUser(request()))
            .isInstanceOf(OAuth2AuthenticationException.class)
            .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                Assertions.assertThat(ex.getError().getErrorCode()).contains("Email not provided"));
    }

    @Test
    void loadUser_throws_whenEmailBlank() {
        // Scenario: provider supplies an email claim that is present but blank/whitespace. Expected: reject.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = mock(OidcUser.class);
        when(upstream.getEmail()).thenReturn("   ");
        when(upstream.getFullName()).thenReturn("Alice");
        CustomOidcUserService service = service(repo, upstream, false);
        Assertions.assertThatThrownBy(() -> service.loadUser(request()))
            .isInstanceOf(OAuth2AuthenticationException.class);
    }

    @Test
    void loadUser_createsUser_whenNotExists_andAddsRoleUserAuthority() {
        // Scenario: first login for a non-admin user.
        // Expected: user is created once, role is USER, and the principal name is the email.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "   ");
        when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        stubSaveReturnsArgument(repo);
        CustomOidcUserService service = service(repo, upstream, false);
        OidcUser result = service.loadUser(request());
        AppUser saved = captureSavedUser(repo);
        Assertions.assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getName()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");
    }

    @Test
    void loadUser_createsUser_whenNameProvided_andPersistsName() {
        // Scenario: first login where provider supplies a real display name.
        // Expected: saved AppUser.name preserves the provider name (not the email fallback).
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice Wonderland");
        when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        stubSaveReturnsArgument(repo);
        CustomOidcUserService service = service(repo, upstream, false);
        OidcUser result = service.loadUser(request());
        AppUser saved = captureSavedUser(repo);
        Assertions.assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo("Alice Wonderland");
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_USER");
    }

    @Test
    void loadUser_createsUser_whenNameNull_andUsesEmailFallback() {
        // Scenario: first login where provider omits the "name" claim. Expected: fall back to email display name.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, null);
        when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        stubSaveReturnsArgument(repo);
        CustomOidcUserService service = service(repo, upstream, false);
        OidcUser result = service.loadUser(request());
        AppUser saved = captureSavedUser(repo);
        Assertions.assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
    }

    @Test
    void loadUser_createsUser_whenAdminEmail_andAddsRoleAdminAuthority() {
        // Scenario: first login for an admin email. Expected: user is provisioned with ADMIN and ROLE_ADMIN present.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "   ");
        when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
        stubSaveReturnsArgument(repo);
        CustomOidcUserService service = service(repo, upstream, true);
        OidcUser result = service.loadUser(request());
        AppUser saved = captureSavedUser(repo);
        Assertions.assertThat(saved.getEmail()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(saved.getName()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(saved.getRole()).isEqualTo(Role.ADMIN);
        Assertions.assertThat(result.getName()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(result.getEmail()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_ADMIN");
    }

    @Test
    void loadUser_handlesRaceCondition_whenSaveFails_thenLoadsExistingUser() {
        // Scenario: concurrent login causes save to fail (unique(email) constraint). Expected: reload and continue.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Existing");
        existing.setRole(Role.USER);
        when(repo.findByEmail(USER_EMAIL))
            .thenReturn(Optional.empty())
            .thenReturn(Optional.of(existing));
        when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));
        CustomOidcUserService service = service(repo, upstream, false);
        OidcUser result = service.loadUser(request());
        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");
        verify(repo, times(1)).save(any(AppUser.class));
        verify(repo, times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_throws_whenSaveFails_andUserStillNotFound() {
        // Scenario: save fails (unique constraint) and the subsequent re-fetch still returns empty.
        // Expected: DataIntegrityViolationException is rethrown.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
        when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));
        CustomOidcUserService service = service(repo, upstream, false);
        Assertions.assertThatThrownBy(() -> service.loadUser(request()))
            .isInstanceOf(DataIntegrityViolationException.class);
        verify(repo, times(1)).save(any(AppUser.class));
        verify(repo, times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired_toAdmin() {
        // Scenario: stored role is USER but email is now considered ADMIN. Expected: role is healed and persisted.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "Alice");
        AppUser existing = new AppUser();
        existing.setEmail(ADMIN_EMAIL);
        existing.setRole(Role.USER);
        when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
        CustomOidcUserService service = service(repo, upstream, true);
        OidcUser result = service.loadUser(request());
        Assertions.assertThat(result.getEmail()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_ADMIN");
        verify(repo, times(1)).findByEmail(ADMIN_EMAIL);
        verify(repo, times(1)).save(any(AppUser.class));
    }

    @Test
    void loadUser_healsRole_whenExistingRoleNull_toUser() {
        // Scenario: legacy/corrupt data where AppUser.role is null. Expected: role healing assigns and persists USER.
        AppUserRepository repo = mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Alice");
        existing.setRole(null);
        when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
        stubSaveReturnsArgument(repo);
        CustomOidcUserService service = service(repo, upstream, false);
        OidcUser result = service.loadUser(request());
        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");
        verify(repo, times(1)).findByEmail(USER_EMAIL);
        verify(repo, times(1)).save(existing);
    }

    private static OidcUserRequest request() {
        return mock(OidcUserRequest.class);
    }

    private static CustomOidcUserService service(AppUserRepository repo, OidcUser upstream, boolean isAdmin) {
        return CustomUserServiceTestSupport.oidcService(repo, upstream, isAdmin);
    }
    private static void stubSaveReturnsArgument(AppUserRepository repo) {
        when(repo.save(any(AppUser.class))).thenAnswer(returnsFirstArg());
    }
    private static AppUser captureSavedUser(AppUserRepository repo) {
        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(repo, times(1)).save(captor.capture());
        return captor.getValue();
    }
}
