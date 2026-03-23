package com.smartsupplypro.inventory.service;

import java.util.Set;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.model.Role;

/**
 * Unit tests for OAuth/OIDC normalization helpers.
 *
 * <p><strong>Purpose</strong>:
 * Validate the deterministic helper logic used by {@link CustomOAuth2UserService} and {@link CustomOidcUserService}
 * to:
 * <ul>
 *   <li>Parse the {@code APP_ADMIN_EMAILS} allow-list payload</li>
 *   <li>Normalize roles to Spring Security {@code ROLE_*} authority strings</li>
 * </ul>
 *
 * <p><strong>Why this class exists</strong>:
 * The primary service tests focus on the {@code loadUser(...)} orchestration logic. Keeping helper normalization
 * assertions in a separate test class reduces boilerplate and keeps each service test file within the agreed size
 * constraints while maintaining coverage of the same branches/instructions.
 */
class CustomUserServiceNormalizationTest {

    @Test
    void oauth2_parseAdminAllowlist_normalizesAndDeduplicatesEmails() {
        // GIVEN: a messy allow-list value (spaces, mixed case, duplicates, empty segments)
        // WHEN: parsing the comma-separated APP_ADMIN_EMAILS payload
        // THEN: the allow-list is trimmed, lowercased, de-duplicated, and order-preserving.
        Set<String> parsed = CustomOAuth2UserService.parseAdminAllowlist(
            "  Admin@corp.com , manager@corp.com,, ADMIN@corp.com ,   ops@corp.com  "
        );

        Assertions.assertThat(parsed)
            .containsExactly("admin@corp.com", "manager@corp.com", "ops@corp.com");
    }

    @Test
    void oidc_parseAdminAllowlist_normalizesAndDeduplicatesEmails() {
        // GIVEN: a messy allow-list value (spaces, mixed case, duplicates, empty segments)
        // WHEN: parsing the comma-separated APP_ADMIN_EMAILS payload
        // THEN: the allow-list is trimmed, lowercased, de-duplicated, and order-preserving.
        Set<String> parsed = CustomOidcUserService.parseAdminAllowlist(
            "  Admin@corp.com , manager@corp.com,, ADMIN@corp.com ,   ops@corp.com  "
        );

        Assertions.assertThat(parsed)
            .containsExactly("admin@corp.com", "manager@corp.com", "ops@corp.com");
    }

    @Test
    void oidc_parseAdminAllowlist_returnsEmptySet_whenRawNullOrBlank() {
        // GIVEN: unset / empty allow-list payload
        // WHEN: parsing null and blank values
        // THEN: the result is an empty set (no admins).
        Assertions.assertThat(CustomOidcUserService.parseAdminAllowlist(null)).isEmpty();
        Assertions.assertThat(CustomOidcUserService.parseAdminAllowlist("   ")).isEmpty();
    }

    @Test
    void oauth2_toRoleAuthority_normalizesRoleNameVariants() throws Exception {
        // GIVEN: role name variants used throughout security configuration
        // WHEN: the service normalizes them to Spring Security ROLE_* authorities
        // THEN: blank/null becomes ROLE_USER; values are prefixed exactly once.
        Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority(null)).isEqualTo("ROLE_USER");
        Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("   ")).isEqualTo("ROLE_USER");
        Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("USER")).isEqualTo("ROLE_USER");
        Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("ROLE_ADMIN")).isEqualTo("ROLE_ADMIN");
    }

    @Test
    void oidc_toRoleAuthority_normalizesRoleEnum() throws Exception {
        // GIVEN: a Role enum value (or null)
        // WHEN: converting to a Spring Security ROLE_* authority
        // THEN: null becomes ROLE_USER; named enums map to ROLE_<NAME>.
        Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(null)).isEqualTo("ROLE_USER");
        Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.USER)).isEqualTo("ROLE_USER");
        Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.ADMIN)).isEqualTo("ROLE_ADMIN");
    }
}
