package com.smartsupplypro.inventory.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Security context service for authorization checks.
 *
 * <p><b>Purpose</b>: Centralized authorization logic for demo mode and role-based access control.
 * Abstracts Spring Security internals from controllers and @PreAuthorize expressions.</p>
 *
 * <p><b>Design Pattern</b>: Security service pattern allows complex authorization rules to be:
 * <ul>
 *   <li>Tested independently from controllers</li>
 *   <li>Shared across multiple @PreAuthorize expressions</li>
 *   <li>Updated in one place (DRY principle)</li>
 *   <li>Works with both OAuth2 (runtime) and test authentication (UsernamePasswordAuthenticationToken)</li>
 * </ul>
 * </p>
 *
 * <p><b>Enterprise Use Cases</b>:
 * <ul>
 *   <li><b>Demo Mode</b>: Read-only access for user evaluation (isDemo=true blocks mutations)</li>
 *   <li><b>Role-Based Access</b>: ADMIN vs. USER authorization checks</li>
 *   <li><b>Feature Flags</b>: Time-limited access during pilot programs</li>
 *   <li><b>Audit Trail</b>: Track who attempted restricted operations</li>
 * </ul>
 * </p>
 *
 * @see <a href="file:../../../../../../docs/architecture/patterns/security-patterns.md">Security Patterns</a>
 */
@Service
public class SecurityService {

    /**
     * Checks if current authenticated user is in demo mode (read-only).
     *
     * <p><b>ENTERPRISE CONTEXT</b>:
     * Demo mode is a product feature that allows:
     * - Sales team to share live app with prospects without granting write access
     * - Training environments where users can explore but not modify data
     * - A/B testing read-only vs. full-access user experiences
     * </p>
     *
     * <p><b>Authorization Behavior</b>:
     * <ul>
     *   <li>OAuth2 runtime (Google/Azure OAuth): Checks `isDemo` attribute set by authentication service</li>
     *   <li>Test authentication (@WithMockUser): Returns false (tests don't set isDemo, only test demo scenarios explicitly)</li>
     *   <li>Unauthenticated: Returns false (no security context)</li>
     * </ul>
     * </p>
     *
     * <p><b>Usage in @PreAuthorize</b>:
     * <pre>
     * &#64;PreAuthorize("hasRole('ADMIN') and !@securityService.isDemo()")
     * public ResponseEntity&lt;ItemDTO&gt; create(@RequestBody ItemDTO item) { ... }
     * </pre>
     * Denies ADMIN users in demo mode from creating items. Normal ADMIN users are allowed.
     * </p>
     *
     * @return true if current user is authenticated AND has isDemo=true; false otherwise
     * @throws java.lang.ClassCastException never thrown (safe type checking in place)
     */
    public boolean isDemo() {
        // Step 1: Retrieve current authentication from thread-local context
        // SecurityContextHolder manages authentication for the current request thread
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // Step 2: Handle unauthenticated requests (null or !isAuthenticated)
        // In these cases, demo mode doesn't apply (no user to be in demo)
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        // Step 3: Extract principal object from authentication token
        // This could be OAuth2User (runtime), UserDetails (standard auth), or other types
        Object principal = authentication.getPrincipal();

        // Step 4: Handle OAuth2 runtime authentication
        // At runtime (with real OAuth2), the principal is an OAuth2User with attributes map
        if (principal instanceof OAuth2User oauth2User) {
            // OAuth2User stores custom attributes (like isDemo) in an attributes map
            // Attribute key must match what CustomOAuth2UserService or CustomOidcUserService sets
            Boolean isDemoAttribute = oauth2User.getAttribute("isDemo");

            // Boolean.TRUE.equals() safely handles null (returns false) and type checking
            // This prevents NullPointerException if isDemo attribute is missing
            return Boolean.TRUE.equals(isDemoAttribute);
        }

        // Step 5: Handle test authentication (@WithMockUser)
        // @WithMockUser creates UsernamePasswordAuthenticationToken, not OAuth2User
        // Tests use explicit OAuth2 mocking only when testing demo scenarios
        // Therefore, standard @WithMockUser tests default to isDemo=false
        return false;
    }
}
