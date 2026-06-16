package com.smartsupplypro.inventory.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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

    /**
     * API logout endpoint for programmatic clients.
     *
     * <p>Invalidates the session and expires cookies.
     * For browser clients, prefer the standard POST /logout endpoint.</p>
     *
     * @param request  HTTP servlet request
     * @param response HTTP servlet response
     * @return 204 No Content response
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> apiLogout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, null);

        // Expire cookies for API clients (SPA/mobile) that can't follow the standard form-POST /logout
        ResponseCookie jsess = ResponseCookie.from("JSESSIONID", "")
                .path("/").httpOnly(true).secure(true).sameSite("None").maxAge(0).build();
        ResponseCookie session = ResponseCookie.from("SESSION", "")
                .path("/").httpOnly(true).secure(true).sameSite("None").maxAge(0).build();

        return ResponseEntity.noContent()
                .header("Set-Cookie", jsess.toString())
                .header("Set-Cookie", session.toString())
                .build();
    }
}
