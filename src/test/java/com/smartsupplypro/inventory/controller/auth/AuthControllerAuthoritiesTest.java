package com.smartsupplypro.inventory.controller.auth;

import java.util.Map;

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
 * Tests {@link AuthController} GET /api/me/authorities endpoint for distinct, sorted
 * authority projection from the OAuth2 principal using {@link MockMvc}.
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

    @Test
    void shouldReturnAuthorities_distinctAndSorted() throws Exception {
        OAuth2AuthenticationToken token = buildAuthTokenWithAuthorities(
                "user@example.com",
                java.util.List.of("ROLE_USER", "ROLE_ADMIN", "ROLE_ADMIN")
        );

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
