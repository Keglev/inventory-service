package com.smartsupplypro.inventory.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal admin-only stub for security slice tests.
 * Provides a deterministic endpoint under {@code /api/admin} so tests can assert 200/403/401
 * without coupling to production controllers. The role is declared the way production
 * declares it, with {@code @PreAuthorize}; the URL layer only requires a sign-in.
 */
@RestController
@RequestMapping("/api/admin")
class AdminStubController {

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/ping")
    String ping() {
        return "admin ok";
    }
}
