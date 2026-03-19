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
 *
 * <p><strong>Scope</strong>:
 * Focus on the post-provisioning logic in {@link CustomOidcUserService#loadUser(OidcUserRequest)}:
 * <ul>
 *   <li><b>Role healing:</b> update persisted {@link AppUser#getRole()} when desired role changes</li>
 *   <li><b>Idempotency:</b> avoid unnecessary writes when the stored role already matches desired</li>
 * </ul>
 *
 * <p><strong>Determinism</strong>:
 * Tests use {@link CustomUserServiceTestSupport#oidcService(AppUserRepository, OidcUser, boolean)} to override
 * {@link CustomOidcUserService#isAdminEmail(String)} so they do not depend on {@code APP_ADMIN_EMAILS}.
 */
class CustomOidcUserServiceRoleHealingTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired_toAdmin() {
        // GIVEN: stored role is USER, but email is now considered ADMIN.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(ADMIN_EMAIL, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(ADMIN_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, true);

        // WHEN
        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        // THEN
        Assertions.assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_ADMIN");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
        Mockito.verify(repo, Mockito.times(1)).findByEmail(ADMIN_EMAIL);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired() {
        // GIVEN: stored role is ADMIN, but email is now considered non-admin.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.ADMIN);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, false);

        // WHEN
        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        // THEN
        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
        Mockito.verify(repo, Mockito.times(1)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_doesNotPersist_whenExistingRoleAlreadyMatchesDesired_andPreservesProviderAuthorities() {
        // GIVEN: stored role already equals desired role.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OidcUser upstream = CustomUserServiceTestSupport.upstreamOidcUser(USER_EMAIL, "Alice");

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));

        CustomOidcUserService service = CustomUserServiceTestSupport.oidcService(repo, upstream, false);

        // WHEN
        OidcUser result = service.loadUser(Mockito.mock(OidcUserRequest.class));

        // THEN: provider authorities are preserved, and application role is added
        Assertions.assertThat(result.getEmail()).isEqualTo(USER_EMAIL);
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .contains("ROLE_OIDC", "ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(USER_EMAIL);
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }
}
