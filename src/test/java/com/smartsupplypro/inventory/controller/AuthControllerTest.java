package com.smartsupplypro.inventory.controller;

import static java.util.Collections.singletonList;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
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
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Integration tests for {@link AuthController}, validating behavior of authenticated user info retrieval.
 * Covers scenarios for both ADMIN and USER roles, invalid credentials, and edge cases like missing email.
 *
 * Uses a mock {@link AppUserRepository} and Spring Security test support with OAuth2 authentication tokens.
 */
@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = true) // Keep Spring Security filters active
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@Import(TestSecurityConfig.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AppUserRepository appUserRepository;

    /**
     * Builds a mock {@link OAuth2AuthenticationToken} containing the given email and role.
     *
     * @param email the email to include in the token
     * @param role the role to assign (e.g. "ADMIN" or "USER")
     * @return OAuth2AuthenticationToken instance for mocking authentication context
     */
    private OAuth2AuthenticationToken buildAuthToken(String email, String role) {
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_" + role),
                Map.of("email", email),
                "email"
        );
        return new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");
    }

    /**
     * Verifies that authenticated users with different roles receive correct profile details
     * when calling GET /api/me.
     *
     * @param role the user role (ADMIN or USER) to test
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return current user details")
    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldReturnCurrentUser_givenRole(Role role) throws Exception {
        String email = role.name().toLowerCase() + "@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName("Test " + role.name());
        user.setRole(role);

        /*  Mock repository to return the user when looked up by email */
        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, role.name())))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Test " + role.name()))
                .andExpect(jsonPath("$.role").value(role.name()));
    }

    /**
     * Verifies that the system returns 401 Unauthorized when the authenticated user is not found
     * in the repository (even though a valid token is present).
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when user not found")
    @Test
    void shouldReturn401WhenUserNotFound() throws Exception {
        String email = "nonexistent@example.com";

        /* repository lookup by email, not by ID */
        when(appUserRepository.findByEmail(email)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    /**
     * Verifies that 401 Unauthorized is returned when the OAuth2 token is missing the email field,
     * which is required for user lookup.
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when email is missing from OAuth2 user")
    @Test
    void testGetCurrentUser_shouldReturn401_whenEmailMissing() throws Exception {
        Map<String, Object> attributes = Map.of("name", "Mock Name");
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"),
                attributes,
                "name"   // Missing "email" as the key field
        );

        OAuth2AuthenticationToken authToken =
                new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        mockMvc.perform(get("/api/me")
                        .with(authentication(authToken))
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not provided by OAuth2 provider"));
    }

    /**
     * Verifies that the endpoint /api/me returns 401 Unauthorized when no authentication is provided.
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when no authentication is provided")
    @Test
    void testGetCurrentUser_shouldReturn401_whenNoAuth() throws Exception {
        mockMvc.perform(get("/api/me").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    /**
     * Verifies that the endpoint still functions correctly when user object has only email set and no name.
     * Useful for handling partially initialized users in early registration stages.
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 200 when only email is present in AppUser")
    @Test
    void testGetCurrentUser_shouldSucceed_whenOnlyEmailPresent() throws Exception {
        String email = "emailonly@example.com";

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(null); // name is allowed to be null
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
/**
 * This class contains integration tests for the AuthController, ensuring that user authentication
 * and profile retrieval works correctly across various scenarios.
 */