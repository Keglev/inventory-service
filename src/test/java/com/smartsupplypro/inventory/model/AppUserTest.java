package com.smartsupplypro.inventory.model;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.Test;

/** Unit tests for the defaults both {@link AppUser} constructors set. */
class AppUserTest {

    @Test
    void should_set_a_fresh_id_role_user_and_creation_time_when_built_with_email_and_name() {
        AppUser user = new AppUser("user@example.com", "User");

        assertThat(UUID.fromString(user.getId())).isNotNull();
        assertThat(user.getRole()).isEqualTo(Role.USER);
        assertThat(user.getCreatedAt()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("user@example.com");
        assertThat(user.getName()).isEqualTo("User");
    }

    @Test
    void should_set_the_same_defaults_and_a_different_id_when_built_without_arguments() {
        AppUser first = new AppUser();
        AppUser second = new AppUser();

        assertThat(UUID.fromString(first.getId())).isNotNull();
        assertThat(first.getId()).isNotEqualTo(second.getId());
        assertThat(first.getRole()).isEqualTo(Role.USER);
        assertThat(first.getCreatedAt()).isNotNull();
    }
}
