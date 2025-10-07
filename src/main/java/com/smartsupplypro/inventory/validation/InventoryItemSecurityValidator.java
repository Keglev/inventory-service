package com.smartsupplypro.inventory.validation;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

/**
 * Security validator for role-based inventory item update restrictions.
 *
 * <p><strong>Access Control</strong>:
 * <ul>
 *   <li><strong>ADMIN</strong>: Full update permissions (name, supplier, quantity, price)</li>
 *   <li><strong>USER</strong>: Restricted to quantity and price updates only</li>
 * </ul>
 *
 * <p><strong>Design</strong>:
 * Validates field-level permissions before service layer commits changes.
 * Throws HTTP 403 for unauthorized field modifications.
 *
 * @see InventoryItemService
 * @see <a href="file:../../../../../../docs/architecture/patterns/validation-patterns.md">Validation Patterns</a>
 */
public class InventoryItemSecurityValidator {

    /**
     * Validates user has permission to update specific inventory item fields.
     * USER role: only quantity and price changes allowed.
     * ADMIN role: full update permissions.
     *
     * @param existing current inventory item entity
     * @param incoming updated item DTO from request
     * @throws ResponseStatusException 401 if not authenticated, 403 if unauthorized field change
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
                .orElse("ROLE_USER"); // Default to USER if not explicitly found

        if (role.equals("ROLE_USER")) {
            boolean nameChanged = !existing.getName().equals(incoming.getName());
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
// This code provides the InventoryItemSecurityValidator class, which enforces security constraints on inventory item updates based on user roles.