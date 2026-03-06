package com.smartsupplypro.inventory.service;

import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Unit tests for {@link SecurityService}.
 *
 * <p><strong>Goal</strong>: Raise branch coverage by exercising the key decision points in
 * {@link SecurityService#isDemo()} under different security-context states.</p>
 *
 * <p><strong>Branches Covered</strong>:</p>
 * <ul>
 *   <li>Unauthenticated (null authentication) -> false</li>
 *   <li>Authentication present but not authenticated -> false</li>
 *   <li>Authenticated, non-OAuth2 principal -> false</li>
 *   <li>Authenticated OAuth2 principal with isDemo=true -> true</li>
 *   <li>Authenticated OAuth2 principal with isDemo missing/false -> false</li>
 * </ul>
 */
class SecurityServiceTest {

    private final SecurityService service = new SecurityService();

    @AfterEach
    @SuppressWarnings("unused") // used by JUnit via reflection
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void isDemo_returnsFalse_whenNoAuthentication() {
        // Scenario: no authentication in SecurityContext.
        // Expected: demo mode is false.
        SecurityContextHolder.clearContext();

        assertFalse(service.isDemo());
    }

    @Test
    void isDemo_returnsFalse_whenAuthenticationIsPresentButNotAuthenticated() {
        // Scenario: security context has an Authentication instance, but it is not authenticated.
        // Expected: demo mode is false.
        Authentication auth = new UsernamePasswordAuthenticationToken("user", "n/a");
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertFalse(service.isDemo());
    }

    @Test
    void isDemo_returnsFalse_whenAuthenticatedButPrincipalIsNotOAuth2User() {
        // Scenario: authenticated request but principal is a non-OAuth2 type (typical in @WithMockUser).
        // Expected: demo mode is false.
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "user",
                "n/a",
                AuthorityUtils.createAuthorityList("ROLE_USER"));
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertFalse(service.isDemo());
    }

    @Test
    void isDemo_returnsTrue_whenOAuth2PrincipalHasIsDemoTrue() {
        // Scenario: authenticated OAuth2 user with attribute isDemo=true.
        // Expected: demo mode is true.
        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"),
                Map.of("isDemo", Boolean.TRUE, "sub", "sub-1"),
                "sub");
        Authentication auth = new UsernamePasswordAuthenticationToken(
                oauth2User,
                "n/a",
                oauth2User.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertTrue(service.isDemo());
    }

    @Test
    void isDemo_returnsFalse_whenOAuth2PrincipalIsDemoMissingOrFalse() {
        // Scenario: OAuth2 user present but isDemo attribute not set.
        // Expected: demo mode is false.
        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"),
                Map.of("sub", "sub-1"),
                "sub");
        Authentication auth = new UsernamePasswordAuthenticationToken(
                oauth2User,
                "n/a",
                oauth2User.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertFalse(service.isDemo());
    }
}
