package com.smartsupplypro.inventory.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Resolves the acting user for audit fields.
 *
 * <p>Audit attribution is server-owned. A client must never be trusted to state who
 * created a row: the value is read from the security context, not from the request
 * body, so it cannot be forged and cannot be omitted.</p>
 *
 * <p>The OAuth2 principal is built with {@code email} as its name attribute (see
 * {@code CustomOAuth2UserService}), so {@link Authentication#getName()} yields the
 * user's email address — the same form the seeded audit rows use.</p>
 */
public final class SecurityAuditHelper {

    /** Attribution used when no authentication is present, e.g. migrations and batch jobs. */
    public static final String SYSTEM_USER = "system";

    private SecurityAuditHelper() {}

    /**
     * Returns the authenticated user's name (their email), or {@link #SYSTEM_USER}
     * when the call runs outside an authenticated request.
     *
     * @return the acting username; never {@code null}
     */
    public static String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext() != null
                ? SecurityContextHolder.getContext().getAuthentication()
                : null;
        return auth != null ? auth.getName() : SYSTEM_USER;
    }
}
