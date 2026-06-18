package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link UserProvisioningService} business logic and exception handling behavior.
 */
@ExtendWith(MockitoExtension.class)
class UserProvisioningServiceTest {

    @InjectMocks UserProvisioningService service;
    @Mock AppUserRepository userRepository;

    @Test
    void should_save_new_user_with_role_user_and_created_at_timestamp_on_first_login() {
        when(userRepository.findById("new@example.com")).thenReturn(Optional.empty());

        service.provisionIfAbsent("new@example.com", "New User");

        ArgumentCaptor<AppUser> cap = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(cap.capture());
        AppUser saved = cap.getValue();
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull().isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    void should_not_save_when_user_already_exists() {
        when(userRepository.findById("exists@example.com"))
                .thenReturn(Optional.of(new AppUser("exists@example.com", "Exists")));
        service.provisionIfAbsent("exists@example.com", "Exists");
        verify(userRepository, never()).save(any());
    }

    @Test
    void should_recover_gracefully_when_concurrent_insert_causes_integrity_violation() {
        when(userRepository.findById("race@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail("race@example.com"))
                .thenReturn(Optional.of(new AppUser("race@example.com", "Race")));

        assertThatNoException().isThrownBy(() -> service.provisionIfAbsent("race@example.com", "Race"));
        verify(userRepository).findByEmail("race@example.com");
    }

    @Test
    void should_throw_illegal_state_when_concurrent_insert_fails_and_fallback_fetch_returns_empty() {
        when(userRepository.findById("miss@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail("miss@example.com")).thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> service.provisionIfAbsent("miss@example.com", "Race"));
        assertThat(ex.getMessage()).isNotBlank();
    }
}
