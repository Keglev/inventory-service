package com.smartsupplypro.inventory.service;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
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
 *
 * <p><strong>Scope</strong>:
 * Validate {@link CustomOidcUserService#loadUser(OidcUserRequest)} without contacting a real provider.
 * These tests focus on application-owned behavior (provisioning and role logic), not provider integration.
 *
 * <p><strong>Behavior Coverage</strong>:
 * <ul>
 *   <li><b>Email-based identity:</b> email is required; missing email rejects authentication.</li>
 *   <li><b>Auto-provisioning:</b> create a local {@link AppUser} on first login (with race-condition handling).</li>
 *   <li><b>Authority merging:</b> preserve provider authorities and add the application role.</li>
 * </ul>
 *
 * <p><strong>Related coverage</strong>:
 * Role healing/idempotency scenarios are covered in {@link CustomOidcUserServiceRoleHealingTest}.
 *
 * <p><strong>Determinism</strong>:
 * Tests override {@link CustomOidcUserService#isAdminEmail(String)} through
 * {@link CustomUserServiceTestSupport#oidcService(AppUserRepository, OidcUser, boolean)} so they do not depend on
 * {@code APP_ADMIN_EMAILS} in the running environment.
 */
class CustomOidcUserServiceTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

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

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "   ");

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, false);

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(captor.capture());
        AppUser saved = captor.getValue();

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
    void loadUser_createsUser_whenAdminEmail_andAddsRoleAdminAuthority() {
        // Scenario: first login for an admin email.
        // Expected:
        //  - user is auto-provisioned with ADMIN role
        //  - provider authority is preserved
        //  - ROLE_ADMIN is added
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "   ");

        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, true);

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        Mockito.verify(repo, Mockito.times(1)).save(captor.capture());
        AppUser saved = captor.getValue();

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
        // Scenario: concurrent login causes save to fail (unique(email) constraint).
        // Expected: service re-loads by email and continues with a valid ROLE_USER principal.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Existing");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, false);

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_throws_whenSaveFails_andUserStillNotFound() {
        // Scenario: save fails (unique constraint) and the subsequent re-fetch still returns empty.
        // Expected: DataIntegrityViolationException is rethrown.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("duplicate"));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, false);

        Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OidcUserRequest.class)))
            .isInstanceOf(DataIntegrityViolationException.class);

        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
        Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired_toAdmin() {
        // Scenario: existing user is stored as USER but is now considered ADMIN (allow-list updated).
        // Expected: role is updated and persisted; returned principal includes ROLE_ADMIN.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(ADMIN_EMAIL);
        existing.setRole(Role.USER);
        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, true);

        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(result.getEmail()).isEqualTo(ADMIN_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_ADMIN");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(ADMIN_EMAIL);
        Mockito.verify(repo, Mockito.times(1)).save(any(AppUser.class));
    }
}
