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
 *
 * <p><strong>Scope</strong>:
 * Focus on the post-provisioning logic in {@link CustomOAuth2UserService#loadUser(OAuth2UserRequest)}:
 * <ul>
 *   <li><b>Role healing:</b> update persisted {@link AppUser#getRole()} when desired role changes</li>
 *   <li><b>Idempotency:</b> avoid unnecessary writes when the stored role already matches desired</li>
 * </ul>
 *
 * <p><strong>Determinism</strong>:
 * Tests use {@link CustomUserServiceTestSupport#oauth2Service(AppUserRepository, OAuth2User, boolean)} to override
 * {@link CustomOAuth2UserService#isAdminEmail(String)} so they do not depend on {@code APP_ADMIN_EMAILS}.
 */
class CustomOAuth2UserServiceRoleHealingTest {

    private static final String USER_EMAIL = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired_toAdmin() {
        // GIVEN: a user stored as USER, but email is now considered ADMIN.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", ADMIN_EMAIL,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(ADMIN_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, true);

        // WHEN: loadUser executes role healing
        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        // THEN: role is updated + persisted and reflected in principal authorities/attributes
        Assertions.assertThat(existing.getRole()).isEqualTo(Role.ADMIN);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("ADMIN");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_ADMIN");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
        Mockito.verify(repo, Mockito.times(1)).findByEmail(ADMIN_EMAIL);
    }

    @Test
    void loadUser_healsRole_whenExistingRoleDoesNotMatchDesired() {
        // GIVEN: a user stored as ADMIN, but email is now considered non-admin.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", USER_EMAIL,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.ADMIN);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));
        Mockito.when(repo.save(any(AppUser.class))).thenAnswer(inv -> inv.getArgument(0));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

        // WHEN
        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        // THEN
        Assertions.assertThat(existing.getRole()).isEqualTo(Role.USER);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).save(existing);
        Mockito.verify(repo, Mockito.times(1)).findByEmail(USER_EMAIL);
    }

    @Test
    void loadUser_doesNotPersist_whenExistingRoleAlreadyMatchesDesired() {
        // GIVEN: stored role already equals desired role.
        AppUserRepository repo = Mockito.mock(AppUserRepository.class);

        OAuth2User upstream = CustomUserServiceTestSupport.oauth2UserWithAttributes(Map.of(
            "email", USER_EMAIL,
            "name", "Alice"
        ));

        AppUser existing = new AppUser();
        existing.setEmail(USER_EMAIL);
        existing.setName("Alice");
        existing.setRole(Role.USER);

        Mockito.when(repo.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));

        CustomOAuth2UserService service = CustomUserServiceTestSupport.oauth2Service(repo, upstream, false);

        // WHEN
        OAuth2User result = service.loadUser(Mockito.mock(OAuth2UserRequest.class));

        // THEN: no-op healing (idempotent login)
        Assertions.assertThat((String) result.getAttribute("email")).isEqualTo(USER_EMAIL);
        Assertions.assertThat((String) result.getAttribute("appRole")).isEqualTo("USER");
        Assertions.assertThat(result.getAuthorities())
            .extracting(GrantedAuthority::getAuthority)
            .containsExactly("ROLE_USER");

        Mockito.verify(repo, Mockito.times(1)).findByEmail(USER_EMAIL);
        Mockito.verify(repo, Mockito.never()).save(any(AppUser.class));
    }
}
