package com.smartsupplypro.inventory.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * REST controller for authentication and current-user profile operations.
 *
 * <p>All endpoints require an active OAuth2 session. No role restrictions
 * beyond authentication — any authenticated user may call these endpoints.</p>
 *
 * @see AppUserRepository
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AppUserRepository appUserRepository;

    public AuthController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    /**
     * DTO for user profile response with frontend-specific fields.
     *
     * @param email      user email address
     * @param fullName   user display name
     * @param role       user role (ADMIN/USER)
     * @param pictureUrl optional profile picture URL
     */
    public record AppUserProfileDTO(
            String email,
            String fullName,
            String role,
            String pictureUrl
    ) {}

    /**
     * Gets the authenticated user's profile information.
     *
     * @param principal OAuth2 authentication principal
     * @return user profile with email, name, role, and optional picture
     * @throws ResponseStatusException 401 if not authenticated or user not found in the database
     */
    @GetMapping("/me")
    public AppUserProfileDTO me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication provided");
        }
        String email = principal.getAttribute("email");
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided by OAuth2 provider");
        }
        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        String picture = principal.getAttribute("picture");
        return new AppUserProfileDTO(user.getEmail(), user.getName(), user.getRole().name(), picture);
    }

    /**
     * Gets user's granted authorities for authorization checks.
     *
     * @param principal OAuth2 authentication principal
     * @return sorted list of authority strings (e.g., ROLE_USER, ROLE_ADMIN)
     * @throws ResponseStatusException 401 if not authenticated
     */
    @GetMapping("/me/authorities")
    public java.util.List<String> meAuthorities(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication");
        }
        return principal.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .distinct()
                .sorted()
                .toList();
    }
}
