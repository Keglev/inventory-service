package com.smartsupplypro.inventory.service.impl;

import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

/**
 * Shared helper methods for InventoryItemServiceImpl test classes.
 * Provides OAuth2 authentication setup for security context.
 */
@SuppressWarnings("unused")
final class InventoryItemServiceImplTestHelper {

    private InventoryItemServiceImplTestHelper() {
        // Utility class
    }

    /**
     * Authenticates the current thread as an OAuth2 user with the given username and roles.
     *
     * @param username the username to authenticate as
     * @param roles    the roles to assign to the user (e.g., "ADMIN", "USER")
     */
    static void authenticateAsOAuth2(String username, String... roles) {
        List<SimpleGrantedAuthority> roleAuthorities =
                Arrays.stream(roles)
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .toList();
        List<SimpleGrantedAuthority> bareAuthorities =
                Arrays.stream(roles)
                        .map(SimpleGrantedAuthority::new)
                        .toList();

        List<GrantedAuthority> authorities = new java.util.ArrayList<>(roleAuthorities.size() + bareAuthorities.size());
        authorities.addAll(roleAuthorities);
        authorities.addAll(bareAuthorities);

        Map<String, Object> attrs = Map.of(
                "sub", username,
                "email", username + "@example.com",
                "name", username
        );
        OAuth2User principal = new DefaultOAuth2User(authorities, attrs, "sub");

        OAuth2AuthenticationToken oauth2 =
                new OAuth2AuthenticationToken(principal, authorities, "test");

        SecurityContextHolder.getContext().setAuthentication(oauth2);
    }

    /**
     * Helper method to mock OAuth2 authentication in the security context.
     *
     * @param email the email/username for the authenticated user
     * @param roles the roles to assign to the user (e.g., "ROLE_ADMIN", "ROLE_USER")
     */
    static void mockOAuth2Authentication(String email, String... roles) {
        Map<String, Object> attributes = Map.of("email", email);

        Collection<GrantedAuthority> authorities = Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        OAuth2User oauth2User = new DefaultOAuth2User(authorities, attributes, "email");

        Authentication auth = new TestingAuthenticationToken(oauth2User, null, authorities);
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }
}
