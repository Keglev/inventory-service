package com.smartsupplypro.inventory.service;

import java.util.Optional;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mockito;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link CustomOidcUserService} role healing and idempotency behavior.
 */
class CustomOidcUserServiceRoleHealingTest {

    private static final String USER_EMAIL  = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void should_update_and_persist_role_when_stored_user_role_is_user_but_email_is_now_admin() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "Alice");
        AppUser existing = appUser(ADMIN_EMAIL, "Alice", Role.USER);
        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        OidcUser result = CustomUserServiceTestSupport.oidcService(repo, upstream, true)
                .loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).contains("ROLE_ADMIN");
        Mockito.verify(repo, Mockito.times(1)).save(existing);
    }

    @Test
    void should_update_and_persist_role_when_stored_user_role_is_admin_but_email_is_no_longer_admin() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
        AppUser existing = appUser(USER_EMAIL, "Alice", Role.ADMIN);
        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        OidcUser result = CustomUserServiceTestSupport.oidcService(repo, upstream, false)
                .loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).contains("ROLE_USER");
        Mockito.verify(repo, Mockito.times(1)).save(existing);
    }

    @Test
    void should_not_persist_when_stored_role_already_matches_desired_and_provider_authorities_are_preserved() {
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);
        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");
        AppUser existing = appUser(USER_EMAIL, "Alice", Role.USER);
        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));

        OidcUser result = CustomUserServiceTestSupport.oidcService(repo, upstream, false)
                .loadUser(Mockito.mock(OidcUserRequest.class));

        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
                .extracting(GrantedAuthority::getAuthority).contains("ROLE_OIDC", "ROLE_USER");
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }

    private static AppUser appUser(String email, String name, Role role) {
        AppUser u = new AppUser(); u.setEmail(email); u.setName(name); u.setRole(role); return u;
    }
}
