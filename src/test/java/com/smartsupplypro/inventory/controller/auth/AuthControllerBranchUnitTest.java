package com.smartsupplypro.inventory.controller.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.controller.AuthController;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Unit tests for {@link AuthController} null-principal guard clauses that are unreachable
 * via MockMvc due to Security filter interception.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerBranchUnitTest {

    @Mock
    private AppUserRepository appUserRepository;

    private AuthController newController() {
        return new AuthController(appUserRepository);
    }

    @Test
    void me_whenPrincipalNull_throwsUnauthorized() {
        AuthController controller = newController();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.me(null));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

        String reason = ex.getReason();
        assertNotNull(reason);
        assertEquals("No authentication provided", reason);
    }

    @Test
    void meAuthorities_whenPrincipalNull_throwsUnauthorized() {
        AuthController controller = newController();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> controller.meAuthorities(null));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());

        String reason = ex.getReason();
        assertNotNull(reason);
        assertEquals("No authentication", reason);
    }
}
