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
 * Authentication controller for user profile and logout operations.
 *
 * <p>Provides current user profile data and API logout functionality.
 * Works with OAuth2 authentication principals and Spring Security.</p>
 *
 * @see AppUserRepository
 * @see <a href="file:../../../../../../docs/architecture/patterns/controller-patterns.md">Controller Patterns</a>
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
     * Gets authenticated user's profile information.
     *
     * @param principal OAuth2 authentication principal
     * @return user profile with email, name, role, and optional picture
     * @throws ResponseStatusException 401 if not authenticated or user not found
     */
    @GetMapping("/me")
    public AppUserProfileDTO me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication provided");
        }
        
        // Enterprise Comment: OAuth2 Identity Resolution
        // 1. Extract email from OAuth2 provider (Google)
        // 2. Load corresponding AppUser entity (created during first login)
        // 3. Return frontend-friendly profile shape
        String email = principal.getAttribute("email");
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided by OAuth2 provider");
        }

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        String picture = principal.getAttribute("picture");

        return new AppUserProfileDTO(
                user.getEmail(),
                user.getName(),              // map to fullName
                user.getRole().name(),       // single role string
                picture
        );
    }
    /**
     * Gets user's granted authorities for authorization checks.
     *
     * @param principal OAuth2 authentication principal
     * @return sorted list of authority strings (e.g., ROLE_USER, ROLE_ADMIN)
     * @throws ResponseStatusException 401 if not authenticated
     */
    @GetMapping("/me/authorities")
    public java.util.List<String> meAuthorities(
            @AuthenticationPrincipal OAuth2User principal) {
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
     * <p>Invalidates session and expires cookies.
     * For browser clients, prefer the standard POST /logout endpoint.</p>
     *
     * @param request  HTTP servlet request
     * @param response HTTP servlet response
     * @return 204 No Content response
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> apiLogout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, null);

        // Enterprise Comment: Cookie Expiration Strategy
        // Explicitly expire session cookies for API clients with secure settings
        // Required for proper logout in SPA and mobile applications
        ResponseCookie jsess = ResponseCookie.from("JSESSIONID", "")
                .path("/")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .maxAge(0)
                .build();

        ResponseCookie session = ResponseCookie.from("SESSION", "")
                .path("/")
                .httpOnly(true)
                .secure(true)
                .sameSite("None")
                .maxAge(0)
                .build();

        return ResponseEntity.noContent()
                .header("Set-Cookie", jsess.toString())
                .header("Set-Cookie", session.toString())
                .build();
    }
}