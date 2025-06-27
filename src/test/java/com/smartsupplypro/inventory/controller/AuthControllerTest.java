package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.config.TestSecurityConfig;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static java.util.Collections.singletonList;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true) // Keep filters
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

    @DisplayName("Should return current user details")
    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldReturnCurrentUser_givenRole(Role role) throws Exception {
        String email = role.name().toLowerCase() + "@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName("Test " + role.name());
        user.setRole(role);

        when(appUserRepository.findById(email)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/me").with(authentication(buildAuthToken(email, role.name()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.name").value("Test " + role.name()))
                .andExpect(jsonPath("$.role").value(role.name()));
    }

    @DisplayName("Should return 401 when user not found")
    @Test
    void shouldReturn401WhenUserNotFound() throws Exception {
        String email = "nonexistent@example.com";

        when(appUserRepository.findById(email)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/me").with(authentication(buildAuthToken(email, "USER"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @DisplayName("Should return 401 when email is missing from OAuth2 user")
    @Test
    void testGetCurrentUser_shouldReturn401_whenEmailMissing() throws Exception {
        Map<String, Object> attributes = Map.of("name", "Mock Name");
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"),
                attributes,
                "name"   // Intentionally missing email attribute
        );

        OAuth2AuthenticationToken authToken =
                new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        mockMvc.perform(get("/api/me").with(authentication(authToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not provided by OAuth2 provider"));
    }

    @DisplayName("Should return 401 when no authentication is provided")
    @Test
    void testGetCurrentUser_shouldReturn401_whenNoAuth() throws Exception {
        mockMvc.perform(get("/api/me").header("Accept", "application/json"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    @DisplayName("Should return 401 when user has no role")
    @Test
    void testGetCurrentUser_shouldSucceed_whenOnlyEmailPresent() throws Exception {
        String email = "emailonly@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(null); // name can be null
        user.setRole(Role.USER);

        when(appUserRepository.findById(email)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/me").with(authentication(buildAuthToken(email, "USER"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
