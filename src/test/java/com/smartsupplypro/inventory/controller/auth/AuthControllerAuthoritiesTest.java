package com.smartsupplypro.inventory.controller.auth;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import static org.mockito.Mockito.verifyNoInteractions;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * # AuthControllerAuthoritiesTest
 *
 * MVC tests for the authority-projection endpoint in {@link AuthController}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the transformation applied by {@code GET /api/me/authorities}: the controller should
 * return a stable, client-friendly list of authority strings derived from the authenticated
 * principal. This endpoint is typically consumed by the UI to drive role-based route guards
 * and feature flags.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>Distinct projection (duplicate authorities are removed)</li>
 *   <li>Sorted output (stable order for deterministic UI behavior)</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Runs as a {@code @WebMvcTest} with Spring Security filters enabled to ensure the
 *       controller is exercised under realistic authentication constraints.</li>
 *   <li>The authority list is derived purely from the principal; repository access is not
 *       expected for this endpoint and is asserted accordingly.</li>
 * </ul>
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(TestSecurityConfig.class)
class AuthControllerAuthoritiesTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    /**
     * Builds an {@link OAuth2AuthenticationToken} with an explicit authority set.
     *
     * <p><strong>Enterprise intent</strong></p>
     * Create a deterministic principal with duplicates and non-sorted entries so the endpoint's
     * normalization logic (distinct + sorted) is verified at the HTTP layer.
     */
    private OAuth2AuthenticationToken buildAuthTokenWithAuthorities(String email, java.util.List<String> authorities) {
        java.util.List<GrantedAuthority> granted = authorities.stream()
                .map(a -> (GrantedAuthority) () -> a)
                .toList();

        OAuth2User principal = new DefaultOAuth2User(
                granted,
                Map.of("email", email),
                "email"
        );

        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /**
     * Validates authority projection behavior for authenticated users.
     *
     * <p><strong>GIVEN:</strong> OAuth2 principal with duplicated and unsorted authorities</p>
     * <p><strong>WHEN:</strong> GET /api/me/authorities is called</p>
     * <p><strong>THEN:</strong> The response is a distinct, sorted list of authority strings</p>
     */
    @Test
    @DisplayName("GET /api/me/authorities returns distinct sorted authorities")
    void shouldReturnAuthorities_distinctAndSorted() throws Exception {
        // GIVEN
        OAuth2AuthenticationToken token = buildAuthTokenWithAuthorities(
                "user@example.com",
                java.util.List.of("ROLE_USER", "ROLE_ADMIN", "ROLE_ADMIN")
        );

        // WHEN/THEN
        mockMvc.perform(get("/api/me/authorities")
                        .with(authentication(token))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0]").value("ROLE_ADMIN"))
                .andExpect(jsonPath("$[1]").value("ROLE_USER"))
                .andExpect(jsonPath("$.length()").value(2));

        // THEN: this endpoint should not need repository access
        verifyNoInteractions(appUserRepository);
    }
}
