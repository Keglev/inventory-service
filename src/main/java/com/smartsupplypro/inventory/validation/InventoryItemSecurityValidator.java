package com.smartsupplypro.inventory.validation;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Enforces field-level authorization rules for inventory item updates.
 *
 * <p>ADMIN principals may update any field; USER principals may only
 * change quantity and price. Cannot be expressed as Bean Validation
 * because it requires reading the live {@link SecurityContextHolder}.</p>
 *
 * @see com.smartsupplypro.inventory.service.impl.inventory.InventoryItemValidationHelper
 */
public class InventoryItemSecurityValidator {

    /**
     * Throws 401 if not authenticated as an OAuth2User, or 403 if a
     * USER principal attempts to change {@code name} or {@code supplierId}.
     *
     * @param existing current persisted entity
     * @param incoming update payload from request
     * @throws ResponseStatusException 401 if unauthenticated, 403 if forbidden field changed
     */
    public static void validateUpdatePermissions(InventoryItem existing, InventoryItemDTO incoming) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof OAuth2User)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized access");
        }

        OAuth2User user = (OAuth2User) auth.getPrincipal();
        String role = user.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .filter(r -> r.equals("ROLE_ADMIN") || r.equals("ROLE_USER"))
                .findFirst()
                .orElse("ROLE_USER"); // unrecognised authorities default to the most restrictive role

        if (role.equals("ROLE_USER")) {
            boolean nameChanged     = !existing.getName().equals(incoming.getName());
            boolean supplierChanged = !existing.getSupplierId().equals(incoming.getSupplierId());

            if (nameChanged || supplierChanged) {
                throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Users are only allowed to change quantity or price."
                );
            }
        }
    }
}
