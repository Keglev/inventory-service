package com.smartsupplypro.inventory.controller.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * # AuthControllerBranchUnitTest
 *
 * Unit tests for guard-clause branches in {@link AuthController}.
 *
 * <p><strong>Purpose</strong></p>
 * Validate the controller's explicit precondition checks that may not be reachable via
 * {@code MockMvc} in a typical Spring Security configuration. In production, unauthenticated
 * requests are rejected by the security filter chain before reaching the controller; however,
 * the controller still contains null-principal guards that represent a contract worth testing.
 *
 * <p><strong>Operations Tested</strong></p>
 * <ul>
 *   <li>{@link AuthController#me(java.security.Principal)}: rejects {@code null} principal</li>
 *   <li>{@link AuthController#meAuthorities(java.security.Principal)}: rejects {@code null} principal</li>
 * </ul>
 *
 * <p><strong>Design Notes</strong></p>
 * <ul>
 *   <li>These are unit-level tests (direct method invocation), intentionally avoiding the
 *       web/security layer so the guard clauses are executed deterministically.</li>
 *   <li>Assertions cover both HTTP status and the reason message because callers may rely on it
 *       for debugging and client-side error handling.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerBranchUnitTest {

    @Mock
    private AppUserRepository appUserRepository;

    private AuthController newController() {
        return new AuthController(appUserRepository);
    }

    @Test
    @DisplayName("me(principal=null) throws 401 with descriptive reason")
    void me_whenPrincipalNull_throwsUnauthorized() {
        // GIVEN: controller invoked without an authenticated principal
        AuthController controller = newController();

        // WHEN
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.me(null));

        // THEN: explicit guard clause produces a 401 with stable reason
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

        String reason = ex.getReason();
        assertNotNull(reason);
        assertEquals("No authentication provided", reason);
    }

    @Test
    @DisplayName("meAuthorities(principal=null) throws 401 with descriptive reason")
    void meAuthorities_whenPrincipalNull_throwsUnauthorized() {
        // GIVEN: controller invoked without an authenticated principal
        AuthController controller = newController();

        // WHEN
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.meAuthorities(null));

        // THEN: explicit guard clause produces a 401 with stable reason
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

        String reason = ex.getReason();
        assertNotNull(reason);
        assertEquals("No authentication", reason);
    }
}
