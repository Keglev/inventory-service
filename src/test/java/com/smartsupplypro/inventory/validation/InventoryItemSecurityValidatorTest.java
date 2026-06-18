package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Unit tests for {@link InventoryItemSecurityValidator}.
 *
 * <p>Validates field-level authorization: ADMIN may update any field;
 * USER may only change quantity and price. Exercises all principal states:
 * unauthenticated, non-OAuth, ADMIN, USER, and unknown authority (defaults to USER).</p>
 */
class InventoryItemSecurityValidatorTest {

    @AfterEach
    void tearDown() { SecurityContextHolder.clearContext(); }

    private static InventoryItem existing() {
        InventoryItem i = new InventoryItem();
        i.setId("item-1"); i.setName("Monitor"); i.setSupplierId("supplier-1");
        i.setQuantity(10); i.setPrice(new BigDecimal("199.99")); return i;
    }

    private static InventoryItemDTO incoming(String name, String supplierId) {
        return InventoryItemDTO.builder().id("item-1").name(name).supplierId(supplierId)
                .quantity(20).price(new BigDecimal("299.99")).createdBy("admin").build();
    }

    private static OAuth2User oauth(String authority) {
        return new DefaultOAuth2User(List.of(new SimpleGrantedAuthority(authority)),
                Map.of("sub", "user-1", "email", "user@test.com"), "sub");
    }

    private static void setAuth(OAuth2User user) {
        SecurityContextHolder.getContext()
                .setAuthentication(new TestingAuthenticationToken(user, "n/a"));
    }

    /**
     * Missing or non-OAuth authentication must be rejected.
     */
    @Nested
    class AuthenticationGuards {
        @Test
        void should_reject_unauthenticated_request_with_401() {
            SecurityContextHolder.clearContext();
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                            existing(), incoming("New", "s-2")));
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }

        @Test
        void should_reject_non_oauth_principal_with_401() {
            SecurityContextHolder.getContext()
                    .setAuthentication(new TestingAuthenticationToken("principal", "n/a"));
            ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                    () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                            existing(), incoming("New", "s-2")));
            assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        }
    }

    /**
     * ADMIN principals may change any field.
     */
    @Nested
    class AdminPermissions {
        @Test
        void should_allow_admin_to_change_name_and_supplier() {
            setAuth(oauth("ROLE_ADMIN"));
            assertDoesNotThrow(() -> InventoryItemSecurityValidator.validateUpdatePermissions(
                    existing(), incoming("New Name", "supplier-2")));
        }
    }

    /**
     * USER principals are restricted to quantity and price changes.
     */
    @Nested
    class UserPermissions {
        @Test
        void should_forbid_user_from_changing_name() {
            setAuth(oauth("ROLE_USER"));
            assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                    () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                            existing(), incoming("Different Name", "supplier-1"))).getStatusCode());
        }

        @Test
        void should_forbid_user_from_changing_supplier() {
            setAuth(oauth("ROLE_USER"));
            assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                    () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                            existing(), incoming("Monitor", "supplier-2"))).getStatusCode());
        }

        @Test
        void should_default_unknown_authority_to_user_restrictions() {
            // unrecognised authority falls back to the most restrictive role
            setAuth(oauth("ROLE_VIEWER"));
            assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                    () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                            existing(), incoming("Different Name", "supplier-2"))).getStatusCode());
        }

        @Test
        void should_allow_user_to_change_quantity_and_price() {
            setAuth(oauth("ROLE_USER"));
            InventoryItem e = existing();
            assertDoesNotThrow(() -> InventoryItemSecurityValidator.validateUpdatePermissions(
                    e, incoming(e.getName(), e.getSupplierId())));
        }
    }
}
