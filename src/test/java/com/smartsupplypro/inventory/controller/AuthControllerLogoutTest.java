package com.smartsupplypro.inventory.controller;

import static java.util.Collections.singletonList;
import java.util.List;
import java.util.Map;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.anyOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content; // used in unauth check (optional)
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.annotation.Resource;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(TestSecurityConfig.class)
class AuthControllerLogoutTest {

    @Resource
    private MockMvc mockMvc;

    // Not directly used by /auth/logout, but present so the slice can instantiate the controller
    @SuppressWarnings("unused")
    @MockitoBean
    private AppUserRepository appUserRepository;

    private OAuth2AuthenticationToken authToken(String email, String role) {
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_" + role),
                Map.of("email", email),
                "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    @Test
    @DisplayName("POST /api/auth/logout → 204 and expires SESSION/JSESSIONID cookies")
    void logout_authenticated_returns204_andExpiresCookies() throws Exception {
        var result = mockMvc.perform(post("/api/auth/logout")
                        .with(authentication(authToken("user@example.com", "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent())
                .andReturn();

        List<String> setCookies = result.getResponse().getHeaders("Set-Cookie");
        // We should have at least two Set-Cookie headers
        assertThat("Expected Set-Cookie headers", setCookies, is(not(empty())));

        // One for JSESSIONID, one for SESSION
        assertThat(setCookies, hasItem(containsString("JSESSIONID=")));
        assertThat(setCookies, hasItem(containsString("SESSION=")));

        // Each cookie should be expired and carry security attributes
        for (String c : setCookies) {
            assertThat(c, containsString("Max-Age=0"));
            assertThat(c, containsString("Path=/"));
            assertThat(c, anyOf(containsString("HttpOnly"), containsString("httponly"))); // case varies by container
            assertThat(c, containsString("SameSite=None"));
            assertThat(c, containsString("Secure"));
        }
    }

    @Test
    @DisplayName("POST /api/auth/logout unauthenticated → 401 JSON from API entry point")
    void logout_unauthenticated_returns401Json() throws Exception {
        mockMvc.perform(post("/api/auth/logout").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }
}

