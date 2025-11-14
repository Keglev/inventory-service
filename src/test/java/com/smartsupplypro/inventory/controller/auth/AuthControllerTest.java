package com.smartsupplypro.inventory.controller.auth;

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
import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Comprehensive test suite for AuthController validating OAuth2 authentication flows
 * and user profile retrieval in the Smart Supply Pro inventory management system.
 * 
 * <p><strong>ENTERPRISE BUSINESS CONTEXT:</strong> This controller handles secure user authentication
 * through OAuth2 providers (Google, GitHub) and provides authenticated user profile data
 * for role-based access control throughout the application. Authentication is critical
 * for inventory access, supplier management, and analytics authorization.</p>
 * 
 * <p><strong>TECHNICAL SCOPE:</strong> Tests OAuth2AuthenticationToken processing, user repository
 * integration, role-based authorization, and error handling for authentication failures.
 * Validates the /api/me endpoint across multiple user states and OAuth2 provider scenarios.</p>
 * 
 * <p><strong>SECURITY TESTING:</strong> Ensures proper authentication validation, missing credential
 * handling, and role-based access control enforcement for enterprise inventory operations.</p>
 * 
 * <p><strong>TEST ARCHITECTURE:</strong> Uses Spring Security test support with OAuth2AuthenticationToken
 * simulation, MockMvc for HTTP layer testing, and Mockito for AppUserRepository isolation.</p>
 */
@SuppressWarnings("unused")
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
     * Builds a mock OAuth2AuthenticationToken for simulating authenticated user context.
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Creates realistic OAuth2 authentication tokens
     * that mirror Google/GitHub OAuth2 provider responses, enabling comprehensive security
     * testing without external dependency on actual OAuth2 providers.</p>
     *
     * @param email the user email to include in the OAuth2 token attributes
     * @param role the user role to assign (e.g. "ADMIN" or "USER") for authorization testing
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
     * Validates authenticated user profile retrieval for different role levels.
     * 
     * <p><strong>GIVEN:</strong> A valid OAuth2 authenticated user with specific role (ADMIN or USER)</p>
     * <p><strong>WHEN:</strong> GET /api/me is called with valid authentication token</p>
     * <p><strong>THEN:</strong> User profile is returned with correct email and role information</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Role-based access control is fundamental for inventory
     * management operations. ADMINs have full system access while USERs have restricted permissions
     * for supplier data, analytics, and inventory modifications.</p>
     *
     * @param role the user role (ADMIN or USER) to test
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return current user details")
    @ParameterizedTest
    @EnumSource(Role.class)
    void shouldReturnCurrentUser_givenRole(Role role) throws Exception {
        // ENTERPRISE: Test both roles to ensure proper authorization boundary enforcement
        String email = role.name().toLowerCase() + "@example.com";

        // GIVEN: A user exists with the specified role in the repository
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName("Test " + role.name());
        user.setRole(role);

        // ENTERPRISE: Mock repository lookup to simulate database user retrieval
        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // WHEN: Authenticated request is made to /api/me endpoint
        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, role.name())))
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: User profile is returned with correct role and profile information
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.fullName").value("Test " + role.name()))
                .andExpect(jsonPath("$.role").value(role.name()));
    }

    /**
     * Validates that authenticated users not found in repository receive unauthorized response.
     * 
     * <p><strong>GIVEN:</strong> Valid OAuth2 token but user doesn't exist in AppUser repository</p>
     * <p><strong>WHEN:</strong> GET /api/me is called with authentication for non-existent user</p>
     * <p><strong>THEN:</strong> 401 Unauthorized is returned with appropriate error message</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Prevents access by users with valid OAuth2 tokens
     * who haven't been properly onboarded to the inventory system. This maintains strict
     * access control for sensitive supplier and inventory data.</p>
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when user not found")
    @Test
    void shouldReturn401WhenUserNotFound() throws Exception {
        // ENTERPRISE: Test security boundary for valid OAuth2 but unregistered users
        String email = "nonexistent@example.com";

        // GIVEN: User has valid OAuth2 token but doesn't exist in our user repository
        when(appUserRepository.findByEmail(email)).thenReturn(Optional.empty());

        // WHEN: Request is made to /api/me with valid OAuth2 but unregistered user
        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: Access is denied with appropriate unauthorized response
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    /**
     * Validates proper handling of incomplete OAuth2 provider responses.
     * 
     * <p><strong>GIVEN:</strong> OAuth2 token missing required email attribute from provider</p>
     * <p><strong>WHEN:</strong> GET /api/me is called with incomplete OAuth2 token</p>
     * <p><strong>THEN:</strong> 401 Unauthorized is returned with descriptive error message</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Some OAuth2 providers may not always include
     * email in token attributes. Email is required for user identification and role assignment
     * in the inventory system, so incomplete tokens must be rejected.</p>
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when email is missing from OAuth2 user")
    @Test
    void testGetCurrentUser_shouldReturn401_whenEmailMissing() throws Exception {
        // ENTERPRISE: Test edge case where OAuth2 provider doesn't include email
        Map<String, Object> attributes = Map.of("name", "Mock Name");
        
        // GIVEN: OAuth2 token with missing email attribute (provider-specific edge case)
        OAuth2User principal = new DefaultOAuth2User(
                singletonList(() -> "ROLE_USER"),
                attributes,
                "name"   // Missing "email" as the key field - simulates provider issue
        );

        OAuth2AuthenticationToken authToken =
                new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        // WHEN: Request is made with incomplete OAuth2 token
        mockMvc.perform(get("/api/me")
                        .with(authentication(authToken))
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: Request is rejected with descriptive error about missing email
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email not provided by OAuth2 provider"));
    }

    /**
     * Validates security enforcement for unauthenticated requests.
     * 
     * <p><strong>GIVEN:</strong> No authentication token provided in request</p>
     * <p><strong>WHEN:</strong> GET /api/me is called without authentication</p>
     * <p><strong>THEN:</strong> 401 Unauthorized is returned with generic error message</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Ensures that sensitive user profile data
     * cannot be accessed without proper authentication. This is fundamental security
     * for protecting inventory system access and user privacy.</p>
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 401 when no authentication is provided")
    @Test
    void testGetCurrentUser_shouldReturn401_whenNoAuth() throws Exception {
        // GIVEN: No authentication provided (anonymous request)
        // WHEN: Request is made to protected endpoint without authentication
        mockMvc.perform(get("/api/me").accept(MediaType.APPLICATION_JSON))
                // THEN: Access is denied with unauthorized status
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Unauthorized"));
    }

    /**
     * Validates graceful handling of partially initialized user profiles.
     * 
     * <p><strong>GIVEN:</strong> User exists with email and role but missing name field</p>
     * <p><strong>WHEN:</strong> GET /api/me is called for user with partial profile data</p>
     * <p><strong>THEN:</strong> User profile is returned successfully with available fields</p>
     * 
     * <p><strong>ENTERPRISE CONTEXT:</strong> Supports scenarios where users are in early
     * registration stages or where OAuth2 providers don't supply full profile information.
     * This ensures inventory system remains functional during user onboarding processes.</p>
     *
     * @throws Exception in case of mock server failure
     */
    @DisplayName("Should return 200 when only email is present in AppUser")
    @Test
    void testGetCurrentUser_shouldSucceed_whenOnlyEmailPresent() throws Exception {
        // ENTERPRISE: Test partial profile data handling during user onboarding
        String email = "emailonly@example.com";

        // GIVEN: User exists with minimal profile data (email and role only)
        AppUser user = new AppUser();
        user.setEmail(email);
        user.setName(null); // ENTERPRISE: Name allowed to be null during registration
        user.setRole(Role.USER);

        when(appUserRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // WHEN: Authenticated request is made with partial profile user
        mockMvc.perform(get("/api/me")
                        .with(authentication(buildAuthToken(email, "USER")))
                        .accept(MediaType.APPLICATION_JSON))
                // THEN: Profile is returned with available data (graceful degradation)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.role").value("USER"));
    }
}
