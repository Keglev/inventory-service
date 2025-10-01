package com.smartsupplypro.inventory.security;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Minimal admin-only controller used exclusively for security smoke tests.
 *
 * <p>This controller exists to validate the {@link com.smartsupplypro.inventory.config.SecurityConfig}
 * authorization rules without pulling in the rest of the application surface. It provides a
 * deterministic endpoint under <code>/api/admin</code> that requires the <code>ADMIN</code>
 * authority to access.</p>
 *
 * <h2>Usage</h2>
 * <ul>
 *   <li>Loaded in test contexts via {@code @WebMvcTest(controllers = AdminStubController.class)}.</li>
 *   <li>Combined with the real {@code SecurityConfig} to assert 200/403/401 behaviors.</li>
 * </ul>
 *
 * @since 2025-08
 */
@RestController
@RequestMapping("/api/admin")
class AdminStubController {

    /**
     * Simple admin-only probe endpoint.
     *
     * <p>Intentionally trivial so tests can focus on the security filter chain rather than
     * controller logic. When the caller has {@code ADMIN} authority, this returns a constant
     * body used by tests to assert success.</p>
     *
     * @return the literal string {@code "admin ok"} when authorization succeeds
     */
    @GetMapping("/ping")
    @SuppressWarnings("unused")
    String ping() {
        return "admin ok";
    }
}

