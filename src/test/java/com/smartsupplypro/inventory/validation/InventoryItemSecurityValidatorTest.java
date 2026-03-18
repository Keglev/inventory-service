package com.smartsupplypro.inventory.validation;

import java.math.BigDecimal;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
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
 * # InventoryItemSecurityValidatorTest
 *
 * Unit tests for {@link InventoryItemSecurityValidator}.
 *
 * <p><strong>Purpose</strong></p>
 * Validates the field-level authorization guard that runs before inventory updates are persisted.
 * The validator reads the current {@link org.springframework.security.core.Authentication} from
 * {@link SecurityContextHolder} and enforces that USERS cannot change sensitive fields.
 *
 * <p><strong>Access Rules</strong></p>
 * <ul>
 *   <li><strong>ADMIN</strong>: may update name/supplier/quantity/price</li>
 *   <li><strong>USER</strong>: may update quantity/price only; name/supplier are forbidden</li>
 * </ul>
 */
@SuppressWarnings({"unused", "java:S1144"}) // JUnit lifecycle methods can be flagged as "unused" by some analyzers.
class InventoryItemSecurityValidatorTest {

    @AfterEach
    void tearDown() {
        clearSecurityContext();
    }

    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private static InventoryItem existingItem() {
        InventoryItem item = new InventoryItem();
        item.setId("item-1");
        item.setName("Monitor");
        item.setSupplierId("supplier-1");
        item.setQuantity(10);
        item.setPrice(new BigDecimal("199.99"));
        return item;
    }

    private static InventoryItemDTO incomingDto(String name, String supplierId) {
        return InventoryItemDTO.builder()
                .id("item-1")
                .name(name)
                .supplierId(supplierId)
                .quantity(20)
                .price(new BigDecimal("299.99"))
                .createdBy("admin")
                .build();
    }

    private static OAuth2User oauthUserWithAuthority(String authority) {
        return new DefaultOAuth2User(
                java.util.List.of(new SimpleGrantedAuthority(authority)),
                Map.of("sub", "user-1", "email", "user@example.test"),
                "sub");
    }

    @Test
    @DisplayName("validateUpdatePermissions: unauthenticated requests are rejected with 401")
    void validateUpdatePermissions_noAuthentication_throws401() {
        // GIVEN: no authentication in security context
        SecurityContextHolder.clearContext();

        // WHEN/THEN
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemSecurityValidator.validateUpdatePermissions(existingItem(), incomingDto("New", "supplier-2")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    @DisplayName("validateUpdatePermissions: non-OAuth principals are rejected with 401")
    void validateUpdatePermissions_nonOAuthPrincipal_throws401() {
        // GIVEN: authentication exists but principal is not an OAuth2User
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("principal", "n/a"));

        // WHEN/THEN
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemSecurityValidator.validateUpdatePermissions(existingItem(), incomingDto("New", "supplier-2")));
        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    }

    @Test
    @DisplayName("ROLE_ADMIN: may change name and supplier")
    void validateUpdatePermissions_admin_allowsSensitiveFieldChanges() {
        // GIVEN: ADMIN principal
        OAuth2User admin = oauthUserWithAuthority("ROLE_ADMIN");
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(admin, "n/a"));

        // WHEN/THEN
        assertDoesNotThrow(() -> InventoryItemSecurityValidator.validateUpdatePermissions(
                existingItem(),
                incomingDto("New Name", "supplier-2")));
    }

    @Test
    @DisplayName("ROLE_USER: name change is forbidden")
    void validateUpdatePermissions_user_nameChange_forbidden() {
        OAuth2User user = oauthUserWithAuthority("ROLE_USER");
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, "n/a"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                        existingItem(),
                        incomingDto("Different Name", "supplier-1")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("ROLE_USER: supplier change is forbidden")
    void validateUpdatePermissions_user_supplierChange_forbidden() {
        OAuth2User user = oauthUserWithAuthority("ROLE_USER");
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, "n/a"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                        existingItem(),
                        incomingDto("Monitor", "supplier-2")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("Default role path: unknown authority defaults to USER restrictions")
    void validateUpdatePermissions_unknownAuthority_defaultsToUserRestrictions() {
        // GIVEN: authority list does not contain ROLE_ADMIN nor ROLE_USER
        OAuth2User user = oauthUserWithAuthority("ROLE_VIEWER");
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, "n/a"));

        // THEN: treated as USER, so sensitive field change is rejected
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> InventoryItemSecurityValidator.validateUpdatePermissions(
                        existingItem(),
                        incomingDto("Different Name", "supplier-2")));
        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }

    @Test
    @DisplayName("ROLE_USER: quantity/price changes are allowed when name/supplier unchanged")
    void validateUpdatePermissions_user_allowsQuantityAndPriceChanges() {
        OAuth2User user = oauthUserWithAuthority("ROLE_USER");
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(user, "n/a"));

        // GIVEN: name and supplier unchanged; other fields may change
        InventoryItem existing = existingItem();
        InventoryItemDTO incoming = incomingDto(existing.getName(), existing.getSupplierId());

        // WHEN/THEN
        assertDoesNotThrow(() -> InventoryItemSecurityValidator.validateUpdatePermissions(existing, incoming));
    }
}
