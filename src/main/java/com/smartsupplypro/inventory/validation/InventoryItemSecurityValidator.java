package com.smartsupplypro.inventory.validation;

import com.smartsupplypro.inventory.dto.InventoryItemDTO;
import com.smartsupplypro.inventory.model.InventoryItem;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;

public class InventoryItemSecurityValidator {

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
                .orElse("ROLE_USER"); // Default to USER

        if (role.equals("ROLE_USER")) {
            boolean nameChanged = !existing.getName().equals(incoming.getName());
            boolean supplierChanged = !existing.getSupplierId().equals(incoming.getSupplierId());

            if (nameChanged || supplierChanged) {
                throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Users are only allowed to change quantity or price.");
            }
        }
    }
}
