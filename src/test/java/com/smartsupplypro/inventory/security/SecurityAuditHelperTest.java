package com.smartsupplypro.inventory.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Unit tests for {@link SecurityAuditHelper}.
 *
 * <p>The contract is narrow and load-bearing: audit fields are attributed from the
 * security context, never from a request body, so the only two outcomes that matter
 * are the authenticated name and the unauthenticated fallback.</p>
 */
class SecurityAuditHelperTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void should_return_authenticated_username() {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new TestingAuthenticationToken("carlos@example.com", null));
        SecurityContextHolder.setContext(context);

        assertEquals("carlos@example.com", SecurityAuditHelper.currentUsername());
    }

    @Test
    void should_fall_back_to_system_when_unauthenticated() {
        SecurityContextHolder.clearContext();

        assertEquals(SecurityAuditHelper.SYSTEM_USER, SecurityAuditHelper.currentUsername());
        assertEquals("system", SecurityAuditHelper.currentUsername());
    }
}
