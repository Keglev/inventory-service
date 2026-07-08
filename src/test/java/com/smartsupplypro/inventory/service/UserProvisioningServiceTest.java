package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link UserProvisioningService} find-or-create, role
 * assignment, role healing, and concurrent-insert recovery.
 */
@ExtendWith(MockitoExtension.class)
class UserProvisioningServiceTest {

    private static final String USER_EMAIL  = "user@example.com";
    private static final String ADMIN_EMAIL = "admin@example.com";

    @InjectMocks UserProvisioningService service;
    @Mock AppUserRepository userRepository;

    @Test
    void should_create_user_with_role_user_and_created_at_on_first_login() {
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(returnsFirstArg());

        AppUser result = service.provision(USER_EMAIL, "New User", false);

        ArgumentCaptor<AppUser> cap = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(cap.capture());
        AppUser saved = cap.getValue();
        assertThat(saved.getEmail()).isEqualTo(USER_EMAIL);
        assertThat(saved.getName()).isEqualTo("New User");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull().isBeforeOrEqualTo(LocalDateTime.now());
        assertThat(result.getRole()).isEqualTo(Role.USER);
    }

    @Test
    void should_create_user_with_role_admin_when_is_admin_true() {
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(returnsFirstArg());

        AppUser result = service.provision(ADMIN_EMAIL, "Admin", true);

        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void should_fall_back_to_email_for_name_when_provider_name_is_blank() {
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class))).thenAnswer(returnsFirstArg());

        AppUser result = service.provision(USER_EMAIL, "   ", false);

        assertThat(result.getName()).isEqualTo(USER_EMAIL);
    }

    @Test
    void should_return_existing_user_without_saving_when_role_already_matches() {
        AppUser existing = appUser(USER_EMAIL, "Existing", Role.USER);
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(existing));

        AppUser result = service.provision(USER_EMAIL, "Existing", false);

        assertThat(result).isSameAs(existing);
        verify(userRepository, never()).save(any());
    }

    @Test
    void should_heal_stored_role_and_persist_when_admin_allowlist_changed() {
        AppUser existing = appUser(ADMIN_EMAIL, "Boss", Role.USER);
        when(userRepository.findByEmail(ADMIN_EMAIL)).thenReturn(Optional.of(existing));

        AppUser result = service.provision(ADMIN_EMAIL, "Boss", true);

        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
        verify(userRepository, times(1)).save(existing);
    }

    @Test
    void should_recover_by_reloading_when_concurrent_insert_causes_integrity_violation() {
        AppUser existing = appUser(USER_EMAIL, "Race", Role.USER);
        when(userRepository.findByEmail(USER_EMAIL))
                .thenReturn(Optional.empty()).thenReturn(Optional.of(existing));
        when(userRepository.save(any(AppUser.class)))
                .thenThrow(new DataIntegrityViolationException("dup"));

        AppUser result = service.provision(USER_EMAIL, "Race", false);

        assertThat(result).isSameAs(existing);
        verify(userRepository, times(2)).findByEmail(USER_EMAIL);
    }

    @Test
    void should_rethrow_data_integrity_exception_when_fallback_fetch_returns_empty() {
        when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.empty());
        when(userRepository.save(any(AppUser.class)))
                .thenThrow(new DataIntegrityViolationException("dup"));

        assertThrows(DataIntegrityViolationException.class,
                () -> service.provision(USER_EMAIL, "Race", false));
        verify(userRepository, times(2)).findByEmail(USER_EMAIL);
    }

    private static AppUser appUser(String email, String name, Role role) {
        AppUser u = new AppUser(); u.setEmail(email); u.setName(name); u.setRole(role); return u;
    }
}
