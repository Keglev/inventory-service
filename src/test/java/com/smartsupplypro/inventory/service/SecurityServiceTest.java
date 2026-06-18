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
 * Unit tests for {@link SecurityService} business logic and exception handling behavior.
 */
class SecurityServiceTest {

    private final SecurityService service = new SecurityService();

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_return_false_when_no_authentication_present() {
        SecurityContextHolder.clearContext();
        assertFalse(service.isDemo());
    }

    @Test
    void should_return_false_when_authentication_is_present_but_not_authenticated() {
        Authentication auth = new UsernamePasswordAuthenticationToken("user", "n/a");
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertFalse(service.isDemo());
    }

    @Test
    void should_return_false_when_authenticated_but_principal_is_not_oauth2_user() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "user", "n/a", AuthorityUtils.createAuthorityList("ROLE_USER"));
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertFalse(service.isDemo());
    }

    @Test
    void should_return_true_when_oauth2_principal_has_is_demo_true() {
        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"),
                Map.of("isDemo", Boolean.TRUE, "sub", "sub-1"),
                "sub");
        Authentication auth = new UsernamePasswordAuthenticationToken(
                oauth2User, "n/a", oauth2User.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertTrue(service.isDemo());
    }

    @Test
    void should_return_false_when_oauth2_principal_is_demo_attribute_is_missing() {
        OAuth2User oauth2User = new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"),
                Map.of("sub", "sub-1"),
                "sub");
        Authentication auth = new UsernamePasswordAuthenticationToken(
                oauth2User, "n/a", oauth2User.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
        assertFalse(service.isDemo());
    }
}
