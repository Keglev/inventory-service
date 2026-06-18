package com.smartsupplypro.inventory.service;

import java.util.Set;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.model.Role;

/**
 * Unit tests for {@link CustomOAuth2UserService} and {@link CustomOidcUserService} normalization helpers
 * covering admin allow-list parsing and role authority string conversion.
 */
class CustomUserServiceNormalizationTest {

    /**
     * Tests for {@code parseAdminAllowlist}.
     */
    @Nested
    class AdminAllowlist {

        @Test
        void should_trim_lowercase_and_deduplicate_email_entries() {
            Set<String> parsed = CustomOAuth2UserService.parseAdminAllowlist(
                    "  Admin@corp.com , manager@corp.com,, ADMIN@corp.com ,   ops@corp.com  ");
            Assertions.assertThat(parsed)
                    .containsExactly("admin@corp.com", "manager@corp.com", "ops@corp.com");
        }

        @Test
        void should_apply_same_normalization_for_oidc_service() {
            Set<String> parsed = CustomOidcUserService.parseAdminAllowlist(
                    "  Admin@corp.com , manager@corp.com,, ADMIN@corp.com ,   ops@corp.com  ");
            Assertions.assertThat(parsed)
                    .containsExactly("admin@corp.com", "manager@corp.com", "ops@corp.com");
        }

        @Test
        void should_return_empty_set_when_raw_value_is_null_or_blank() {
            Assertions.assertThat(CustomOidcUserService.parseAdminAllowlist(null)).isEmpty();
            Assertions.assertThat(CustomOidcUserService.parseAdminAllowlist("   ")).isEmpty();
        }
    }

    /**
     * Tests for {@code toRoleAuthority}.
     */
    @Nested
    class RoleAuthorityNormalization {

        @Test
        void should_normalize_oauth2_role_name_variants_to_role_prefixed_authority() throws Exception {
            Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority(null)).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("   ")).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("USER")).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oauth2RoleAuthority("ROLE_ADMIN")).isEqualTo("ROLE_ADMIN");
        }

        @Test
        void should_normalize_oidc_role_enum_to_role_prefixed_authority() throws Exception {
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(null)).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.USER)).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.ADMIN)).isEqualTo("ROLE_ADMIN");
        }
    }
}
