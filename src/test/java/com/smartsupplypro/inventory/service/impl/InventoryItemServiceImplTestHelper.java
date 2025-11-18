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
 *
 * <p><strong>Purpose</strong></p>
 * <ul>
 *   <li>Provides OAuth2 authentication setup for test security context.</li>
 *   <li>Simplifies mocking of authenticated user scenarios across multiple test classes.</li>
 * </ul>
 *
 * <p><strong>Key Methods</strong></p>
 * <ul>
 *   <li><b>authenticateAsOAuth2:</b> Sets up OAuth2 principal with roles in security context (recommended).</li>
 *   <li><b>mockOAuth2Authentication:</b> Alternative using TestingAuthenticationToken (legacy).</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>Both methods populate {@link SecurityContextHolder} for {@code @WithMockUser}-style behavior.</li>
 *   <li>authenticateAsOAuth2 uses OAuth2AuthenticationToken (matches Spring OAuth2 flow).</li>
 *   <li>mockOAuth2Authentication uses TestingAuthenticationToken (simpler, deprecated path).</li>
 * </ul>
 */
@SuppressWarnings("unused")
final class InventoryItemServiceImplTestHelper {

    private InventoryItemServiceImplTestHelper() {
        // Utility class - no instances
    }

    /**
     * Authenticates the current thread as an OAuth2 user with the given username and roles.
     * Sets up OAuth2AuthenticationToken in SecurityContextHolder (mimics Google OAuth2 flow).
     *
     * @param username the username/email to authenticate as (will be used as principal and email attribute)
     * @param roles    the roles to assign to the user (e.g., "ADMIN", "USER") - will be prefixed with "ROLE_"
     */
    static void authenticateAsOAuth2(String username, String... roles) {
        // Create role authorities with ROLE_ prefix (e.g., "ADMIN" -> "ROLE_ADMIN")
        List<SimpleGrantedAuthority> roleAuthorities =
                Arrays.stream(roles)
                        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
                        .toList();
        // Create bare authorities without prefix (some code paths check both forms)
        List<SimpleGrantedAuthority> bareAuthorities =
                Arrays.stream(roles)
                        .map(SimpleGrantedAuthority::new)
                        .toList();

        // Combine both authority lists to cover all code paths
        List<GrantedAuthority> authorities = new java.util.ArrayList<>(roleAuthorities.size() + bareAuthorities.size());
        authorities.addAll(roleAuthorities);
        authorities.addAll(bareAuthorities);

        // Create OAuth2 attributes matching Google OAuth2 structure
        Map<String, Object> attrs = Map.of(
                "sub", username,                     // Subject: user ID
                "email", username + "@example.com", // Email attribute
                "name", username                    // User name
        );
        // Create OAuth2User principal with attributes and authorities
        OAuth2User principal = new DefaultOAuth2User(authorities, attrs, "sub");

        // Create OAuth2AuthenticationToken (mimics Spring OAuth2 authentication flow)
        OAuth2AuthenticationToken oauth2 =
                new OAuth2AuthenticationToken(principal, authorities, "test");

        // Set in security context so @PreAuthorize and hasRole() checks will see it
        SecurityContextHolder.getContext().setAuthentication(oauth2);
    }

    /**
     * Alternative authentication helper using TestingAuthenticationToken.
     * Less realistic than authenticateAsOAuth2 but simpler for basic tests.
     *
     * @param email the email/username for the authenticated user
     * @param roles the roles to assign (will be passed as-is, no prefix added)
     */
    static void mockOAuth2Authentication(String email, String... roles) {
        // Create minimal OAuth2 attributes (email only)
        Map<String, Object> attributes = Map.of("email", email);

        // Create GrantedAuthority collection from role strings
        Collection<GrantedAuthority> authorities = Arrays.stream(roles)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        // Create OAuth2User with email attribute as principal name attribute
        OAuth2User oauth2User = new DefaultOAuth2User(authorities, attributes, "email");

        // Create TestingAuthenticationToken (simpler but less realistic than OAuth2AuthenticationToken)
        Authentication auth = new TestingAuthenticationToken(oauth2User, null, authorities);
        // Create empty context and set authentication
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }
}
