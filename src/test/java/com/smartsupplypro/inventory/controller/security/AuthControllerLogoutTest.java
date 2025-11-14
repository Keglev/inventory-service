package com.smartsupplypro.inventory.controller.security;

import static java.util.Collections.singletonList;
import java.util.List;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.collection.IsEmptyCollection.empty;
import static org.hamcrest.core.AnyOf.anyOf;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.annotation.Resource;

/**
 * MVC tests for AuthController logout functionality.
 * 
 * Validates session invalidation and secure cookie cleanup:
 * - POST /api/auth/logout (authenticated user)
 * - 401 response for unauthenticated logout attempts
 * - Cookie expiration with proper security attributes
 */
@SuppressWarnings("unused")
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(TestSecurityConfig.class)
class AuthControllerLogoutTest {

    @Resource
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    /**
     * Creates OAuth2AuthenticationToken for logout testing.
     */
    private OAuth2AuthenticationToken authToken(String email, String role) {
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(new SimpleGrantedAuthority("ROLE_" + role)),
                Map.of("email", email),
                "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /**
     * Tests complete session invalidation during logout.
     * Given: Authenticated user with valid OAuth2 session
     * When: POST /api/auth/logout
     * Then: Returns 204 and expires session cookies with security attributes
     */
    @Test
    @DisplayName("POST /api/auth/logout -> 204 and expires SESSION/JSESSIONID cookies")
    void logout_authenticated_returns204_andExpiresCookies() throws Exception {
        OAuth2AuthenticationToken auth = authToken("admin@example.com", "ADMIN");

        var result = mockMvc.perform(post("/api/auth/logout")
                        .with(authentication(auth))
                        .with(csrf()))
                .andExpect(status().isNoContent())
                .andReturn();

        List<String> setCookies = result.getResponse().getHeaders("Set-Cookie");
        assertThat("Expected Set-Cookie headers", setCookies, is(not(empty())));

        assertThat(setCookies, hasItem(containsString("JSESSIONID=")));
        assertThat(setCookies, hasItem(containsString("SESSION=")));

        for (String c : setCookies) {
            assertThat(c, containsString("Max-Age=0"));
            assertThat(c, containsString("Path=/"));
            assertThat(c, anyOf(containsString("HttpOnly"), containsString("httponly")));
            assertThat(c, containsString("SameSite=None"));
            assertThat(c, containsString("Secure"));
        }
    }

    /**
     * Tests rejection of unauthenticated logout attempts.
     * Given: No authentication context
     * When: POST /api/auth/logout without authentication
     * Then: Returns 401 Unauthorized
     */
    @Test
    @DisplayName("POST /api/auth/logout unauthenticated -> 401")
    void logout_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isUnauthorized());
    }
}
