package com.smartsupplypro.inventory.service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.assertj.core.api.Assertions;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.smartsupplypro.inventory.model.Role;

/**
 * Unit tests for {@link CustomOidcUserService} normalization helpers
 * covering admin allow-list parsing and role authority string conversion.
 */
class CustomUserServiceNormalizationTest {

    /**
     * Tests for {@code normalizeAllowlist}.
     */
    @Nested
    class AdminAllowlist {

        @Test
        void should_trim_lowercase_and_deduplicate_when_building_the_admin_allowlist() {
            Set<String> parsed = CustomOidcUserService.normalizeAllowlist(Arrays.asList(
                    "  Admin@corp.com ", "manager@corp.com", "", null, "ADMIN@corp.com ", "   ops@corp.com  "));
            Assertions.assertThat(parsed)
                    .containsExactly("admin@corp.com", "manager@corp.com", "ops@corp.com");
        }

        @Test
        void should_return_empty_set_when_the_list_is_null_or_blank() {
            Assertions.assertThat(CustomOidcUserService.normalizeAllowlist(null)).isEmpty();
            Assertions.assertThat(CustomOidcUserService.normalizeAllowlist(List.of("   "))).isEmpty();
        }
    }

    /**
     * Tests for {@code toRoleAuthority}.
     */
    @Nested
    class RoleAuthorityNormalization {

        @Test
        void should_prefix_the_authority_with_role_when_an_oidc_role_enum_is_given() throws Exception {
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(null)).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.USER)).isEqualTo("ROLE_USER");
            Assertions.assertThat(CustomUserServiceTestSupport.oidcRoleAuthority(Role.ADMIN)).isEqualTo("ROLE_ADMIN");
        }
    }
}
