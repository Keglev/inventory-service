package com.smartsupplypro.inventory.service;

import java.util.Map;
import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOAuth2UserService} role healing and idempotency behavior.
 */
class CustomOAuth2UserServiceRoleHealingTest {

    private static final String USER_EMAIL  = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void should_update_and_persist_role_when_stored_user_role_is_user_but_email_is_now_admin() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(
                Map.of("email", ADMIN_EMAIL, "name", "Alice"));
        AppUser existing = appUser(ADMIN_EMAIL, "Alice", Role.USER);
        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        OAuth2User result = CustomUserServiceTestSupport.oauth2Service(repo, upstream, true)
                .loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("ADMIN");
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_ADMIN");
        Mockito.verify(repo, Mockito.times(1)).save(existing);
    }

    @Test
    void should_update_and_persist_role_when_stored_user_role_is_admin_but_email_is_no_longer_admin() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(
                Map.of("email", USER_EMAIL, "name", "Alice"));
        AppUser existing = appUser(USER_EMAIL, "Alice", Role.ADMIN);
        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        OAuth2User result = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false)
                .loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
        Mockito.verify(repo, Mockito.times(1)).save(existing);
    }

    @Test
    void should_not_persist_when_stored_role_already_matches_desired() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(
                Map.of("email", USER_EMAIL, "name", "Alice"));
        AppUser existing = appUser(USER_EMAIL, "Alice", Role.USER);
        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));

        OAuth2User result = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false)
                .loadUser(Mockito.mock(OAuth2UserRequest.class));

        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).containsExactly("ROLE_USER");
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }

    private static AppUser appUser(String email, String name, Role role) {
        AppUser u = new AppUser(); u.setEmail(email); u.setName(name); u.setRole(role); return u;
    }
}
