package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
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
 * Unit tests for {@link UserProvisioningService}.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>First-login creates a new {@link AppUser} with {@link Role#USER} and a {@code createdAt} timestamp.</li>
 *   <li>Existing user: no duplicate save.</li>
 *   <li>Concurrent creation race: {@link DataIntegrityViolationException} resolved via
 *       {@code findByEmail} fallback.</li>
 *   <li>Race fallback missing user: propagates {@link IllegalStateException}.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context: pure Mockito with {@link MockitoExtension}.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class UserProvisioningServiceTest {

    @InjectMocks
    UserProvisioningService service;

    @Mock
    AppUserRepository userRepository;

    @Test
    @DisplayName("First login: saves user with ROLE_USER and createdAt timestamp")
    void firstLogin_savesUserWithRoleAndTimestamp() {
        when(userRepository.findById("new@example.com")).thenReturn(Optional.empty());

        service.provisionIfAbsent("new@example.com", "New User");

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        AppUser saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull().isBeforeOrEqualTo(LocalDateTime.now());
    }

    @Test
    @DisplayName("Existing user: no save on repeated login")
    void existingUser_noSave() {
        when(userRepository.findById("exists@example.com"))
            .thenReturn(Optional.of(new AppUser("exists@example.com", "Exists")));

        service.provisionIfAbsent("exists@example.com", "Exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Concurrent creation: DataIntegrityViolation resolved via findByEmail fallback")
    void concurrentCreation_resolvedByFindByEmail() {
        when(userRepository.findById("race@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail("race@example.com"))
            .thenReturn(Optional.of(new AppUser("race@example.com", "Race")));

        assertThatNoException().isThrownBy(() ->
            service.provisionIfAbsent("race@example.com", "Race"));
        verify(userRepository).findByEmail("race@example.com");
    }

    @Test
    @DisplayName("Concurrent creation: fallback lookup missing -> IllegalStateException")
    void concurrentCreation_fallbackMissingUser_throws() {
        when(userRepository.findById("race-miss@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail("race-miss@example.com")).thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            service.provisionIfAbsent("race-miss@example.com", "Race"));
        assertThat(ex.getMessage()).isNotBlank();
    }
}
