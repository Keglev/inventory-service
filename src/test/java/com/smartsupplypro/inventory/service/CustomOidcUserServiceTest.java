package com.smartsupplypro.inventory.service;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Nested;
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
 * Unit tests for {@link CustomOidcUserService} business logic and exception handling behavior.
 */
class CustomOidcUserServiceTest {

    private static final String USER_EMAIL  = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    /**
     * Tests for email validation in {@code loadUser}.
     */
    @Nested
    class EmailValidation {

        @Test
        void should_throw_oauth2_exception_when_email_claim_is_null() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = mock(OidcUser.class);
            when(upstream.getEmail()).thenReturn(null);
            when(upstream.getFullName()).thenReturn("Alice");
            Assertions.assertThatThrownBy(() -> service(repo, upstream, false).loadUser(request()))
                    .isInstanceOf(OAuth2AuthenticationException.class)
                    .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                            Assertions.assertThat(ex.getError().getErrorCode()).contains("Email not provided"));
        }

        @Test
        void should_throw_oauth2_exception_when_email_claim_is_blank() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = mock(OidcUser.class);
            when(upstream.getEmail()).thenReturn("   ");
            when(upstream.getFullName()).thenReturn("Alice");
            Assertions.assertThatThrownBy(() -> service(repo, upstream, false).loadUser(request()))
                    .isInstanceOf(OAuth2AuthenticationException.class);
        }
    }

    /**
     * Tests for first-login provisioning and role assignment in {@code loadUser}.
     */
    @Nested
    class Provisioning {

        @Test
        void should_create_user_with_role_user_and_fall_back_to_email_when_name_is_blank() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "   ");
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            stubSave(repo);
            OidcUser result = service(repo, upstream, false).loadUser(request());
            AppUser saved = captureSaved(repo);
            Assertions.assertThat(saved.getName()).isEqualTo(USER_EMAIL);
            Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).contains("ROLE_USER");
        }

        @Test
        void should_persist_provider_name_when_non_blank() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice Wonderland");
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            stubSave(repo);
            service(repo, upstream, false).loadUser(request());
            Assertions.assertThat(captureSaved(repo).getName()).isEqualTo("Alice Wonderland");
        }

        @Test
        void should_fall_back_to_email_when_name_claim_is_null() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, null);
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            stubSave(repo);
            service(repo, upstream, false).loadUser(request());
            Assertions.assertThat(captureSaved(repo).getName()).isEqualTo(USER_EMAIL);
        }

        @Test
        void should_create_user_with_role_admin_when_email_is_in_admin_allowlist() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "   ");
            when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
            stubSave(repo);
            OidcUser result = service(repo, upstream, true).loadUser(request());
            Assertions.assertThat(captureSaved(repo).getRole()).isEqualTo(Role.ADMIN);
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).contains("ROLE_OIDC", "ROLE_ADMIN");
        }
    }

    /**
     * Tests for concurrent-creation race condition and role healing in {@code loadUser}.
     */
    @Nested
    class RaceConditionAndRoleHealing {

        @Test
        void should_recover_by_reloading_user_when_save_fails_due_to_concurrent_insert() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
            AppUser existing = appUser(USER_EMAIL, "Existing", Role.USER);
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
            when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("dup"));
            OidcUser result = service(repo, upstream, false).loadUser(request());
            Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).contains("ROLE_USER");
            verify(repo, times(2)).findByEmail(USER_EMAIL);
        }

        @Test
        void should_rethrow_data_integrity_exception_when_fallback_fetch_also_returns_empty() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("dup"));
            Assertions.assertThatThrownBy(() -> service(repo, upstream, false).loadUser(request()))
                    .isInstanceOf(DataIntegrityViolationException.class);
        }

        @Test
        void should_heal_stored_role_and_persist_when_role_mismatches_admin_allowlist() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "Alice");
            AppUser existing = appUser(ADMIN_EMAIL, "Alice", Role.USER);
            when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
            OidcUser result = service(repo, upstream, true).loadUser(request());
            Assertions.assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).contains("ROLE_OIDC", "ROLE_ADMIN");
            verify(repo, times(1)).save(any(AppUser.class));
        }

        @Test
        void should_heal_null_role_to_user_and_persist() {
            AppUserRepository repo = mock(AppUserRepository.class);
            OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
            AppUser existing = appUser(USER_EMAIL, "Alice", null);
            when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
            stubSave(repo);
            OidcUser result = service(repo, upstream, false).loadUser(request());
            Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).contains("ROLE_USER");
            verify(repo, times(1)).save(existing);
        }
    }

    private static OidcUserRequest request() { return mock(OidcUserRequest.class); }

    private static CustomOidcUserService service(AppUserRepository repo, OidcUser upstream, boolean isAdmin) {
        return CustomUserServiceTestSupport.oidcService(repo, upstream, isAdmin);
    }

    private static void stubSave(AppUserRepository repo) {
        when(repo.save(any(AppUser.class))).thenAnswer(returnsFirstArg());
    }

    private static AppUser captureSaved(AppUserRepository repo) {
        ArgumentCaptor<AppUser> cap = ArgumentCaptor.forClass(AppUser.class);
        verify(repo, times(1)).save(cap.capture());
        return cap.getValue();
    }

    private static AppUser appUser(String email, String name, Role role) {
        AppUser u = new AppUser(); u.setEmail(email); u.setName(name); u.setRole(role); return u;
    }
}
