package com.smartsupplypro.inventory.controller.auth;

import static java.util.Collections.singletonList;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Tests {@link AuthController} GET /api/me endpoint for OAuth2 authentication flows,
 * role projection, and error handling across all Role values using {@link MockMvc}.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(TestSecurityConfig.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    private OAuth2AuthenticationToken buildAuthToken(String email, String role) {
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_" + role),
                Map.of("email", email),
                "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldReturnCurrentUser_givenRole(Role role) throws Exception {
        String email = role.name().toLowerCase() + "@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName("Test " + role.name());
        user.setRole(role);

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, role.name())))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Test " + role.name()))
                .andExpect(jsonPath("$.role").value(role.name()));
    }

    @Test
    void shouldReturn401WhenUserNotFound() throws Exception {
        String email = "nonexistent@example.com";
        when(appUserRepository.findByEmail(email)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void testGetCurrentUser_shouldReturn401_whenEmailMissing() throws Exception {
        Map<String, Object> attributes = Map.of("name", "Mock Name");

        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"),
                attributes,
                "name"   // Missing "email" as the key field - simulates provider issue
        );

        OAuth2AuthenticationToken authToken =
                new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        mockMvc.perform(get("/api/me")
                        .with(authentication(authToken))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not provided by OAuth2 provider"));
    }

    @Test
    void testGetCurrentUser_shouldReturn401_whenNoAuth() throws Exception {
        mockMvc.perform(get("/api/me").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @Test
    void testGetCurrentUser_shouldSucceed_whenOnlyEmailPresent() throws Exception {
        String email = "emailonly@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(null);
        user.setRole(Role.USER);

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
