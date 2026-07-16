package com.smartsupplypro.inventory.service;

import java.util.Map;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Nested;
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
 * Unit tests for {@link CustomOAuth2UserService} business logic and exception handling behavior.
 */
class CustomOAuth2UserServiceTest {

    private static final String USER_EMAIL  = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    /**
     * Tests for email validation in {@code loadUser}.
     */
    @Nested
    class EmailValidation {

        @Test
        void should_throw_oauth2_exception_when_email_attribute_is_missing() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of("name", "Alice"));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

            Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OAuth2UserRequest.class)))
                    .isInstanceOf(OAuth2AuthenticationException.class)
                    .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                            Assertions.assertThat(ex.getError().getErrorCode()).contains("Email not provided"));
        }

        @Test
        void should_throw_access_denied_when_email_not_on_allowlist() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
                    "email", USER_EMAIL, "name", "Alice"));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2ServiceDenied(repo, upstream);

            Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OAuth2UserRequest.class)))
                    .isInstanceOf(OAuth2AuthenticationException.class)
                    .isInstanceOfSatisfying(OAuth2AuthenticationException.class, ex ->
                            Assertions.assertThat(ex.getError().getErrorCode()).isEqualTo("access_denied"));
        }
    }

    /**
     * Tests for first-login provisioning and role assignment in {@code loadUser}.
     */
    @Nested
    class Provisioning {

        @Test
        void should_create_user_with_role_user_and_blank_name_falls_back_to_email() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
                    "email", USER_EMAIL, "name", "   "));
            Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

            OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

            ArgumentCaptor<AppUser> cap = ArgumentCaptor.forClass(AppUser.class);
            Mockito.verify(repo).save(cap.capture());
            AppUser saved = cap.getValue();
            Assertions.assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
            Assertions.assertThat(saved.getName()).isEqualTo(USER_EMAIL);
            Assertions.assertThat(saved.getRole()).isEqualTo(Role.USER);
            Assertions.assertThat(saved.getCreatedAt()).isNotNull();
            Assertions.assertThat(result.getName()).isEqualTo(USER_EMAIL);
            Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
        }

        @Test
        void should_create_user_with_role_admin_when_email_is_in_admin_allowlist() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of("email", ADMIN_EMAIL));
            Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
            Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, true);

            OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

            ArgumentCaptor<AppUser> cap = ArgumentCaptor.forClass(AppUser.class);
            Mockito.verify(repo).save(cap.capture());
            Assertions.assertThat(cap.getValue().getRole()).isEqualTo(Role.ADMIN);
            Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("ADMIN");
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN");
        }
    }

    /**
     * Tests for concurrent-creation race condition handling in {@code loadUser}.
     */
    @Nested
    class RaceCondition {

        @Test
        void should_recover_by_reloading_user_when_save_fails_due_to_concurrent_insert() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
                    "email", USER_EMAIL, "name", "Alice"));
            AppUser existing = new AppUser();
            existing.setEmail(USER_EMAIL); existing.setName("Existing"); existing.setRole(Role.USER);
            Mockito.when(repo.findByEmail(USER_EMAIL))
                    .thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
            Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("dup"));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

            OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

            Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
            Assertions.assertThat(result.getAuthorities())
                    .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
            Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
        }

        @Test
        void should_rethrow_data_integrity_exception_when_fallback_fetch_also_returns_empty() {
            AppUserRepository repo = Mockito.mock(AppUserRepository.class);
            OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
                    "email", USER_EMAIL, "name", "Alice"));
            Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
            Mockito.when(repo.save(any(AppUser.class))).thenThrow(new DataIntegrityViolationException("dup"));
            CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

            Assertions.assertThatThrownBy(() -> service.loadUser(Mockito.mock(OAuth2UserRequest.class)))
                    .isInstanceOf(DataIntegrityViolationException.class);
            Mockito.verify(repo, Mockito.times(2)).findByEmail(USER_EMAIL);
        }
    }
}
