package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

/**
 * Security-focused validation utility for InventoryItem operations.
 * <p>
 * This class enforces role-based access control for update operations
 * on inventory items. Specifically:
 * <ul>
 *   <li><strong>ADMIN</strong> users may perform full updates</li>
 *   <li><strong>USER</strong> roles are restricted to only updating quantity and price</li>
 * </ul>
 * The validator throws HTTP 403 errors if permission constraints are violated.
 * </p>
 * 
 * <p>
 * Usage: This validator is typically called from service-layer update logic
 * to ensure unauthorized field changes are blocked at runtime.
 * </p>
 * 
 * @author
 * SmartSupplyPro Dev Team
 */
public class InventoryItemSecurityValidator {

    /**
     * Validates whether the currently authenticated user has permission to update
     * specific fields of an inventory item based on their role.
     * <p>
     * If the user is a regular USER (not ADMIN), changes to the item's name or supplier
     * will result in an HTTP 403 Forbidden response.
     * </p>
     *
     * @param existing the existing InventoryItem entity from the database
     * @param incoming the DTO containing updated item fields from the request
     * @throws ResponseStatusException if authentication is missing or access is denied
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