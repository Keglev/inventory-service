package com.smartsupplypro.inventory.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

/**
 * Spring Security integration component. Interface omitted as this class
 * adapts framework contracts, not domain logic.
 *
 * <p>Abstracts Spring Security internals from controllers and
 * {@code @PreAuthorize} expressions, making complex authorization rules
 * testable independently and reusable across the application.</p>
 *
 * @see com.smartsupplypro.inventory.service.CustomOAuth2UserService
 */
@Service
public class SecurityService {

    /**
     * Returns true if the current authenticated user is in demo (read-only) mode.
     *
     * <p>Demo mode allows prospects and training users to explore the application
     * without performing write operations. The {@code isDemo} attribute is set
     * during OAuth2 login by {@link CustomOAuth2UserService}.</p>
     *
     * <p>Returns false for unauthenticated requests and for test authentication
     * ({@code @WithMockUser}) because those contexts never set the attribute.</p>
     *
     * @return true if current user is authenticated and has {@code isDemo=true}
     */
    public boolean isDemo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        Object principal = authentication.getPrincipal();

        if (principal instanceof OAuth2User oauth2User) {
            // isDemo attribute is only present on OAuth2 principals provisioned at runtime
            return Boolean.TRUE.equals(oauth2User.getAttribute("isDemo"));
        }

        // Non-OAuth2 principals (e.g. UsernamePasswordAuthenticationToken in tests) are never demo
        return false;
    }
}
