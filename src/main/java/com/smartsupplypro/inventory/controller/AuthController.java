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
 * Authentication-related endpoints (current user profile; API-only logout).
 *
 * <p>Important contract for the front-end:
 * <ul>
 *   <li><b>GET /api/me</b> returns a minimal profile: {@code email}, {@code fullName}, {@code role} (single string),
 *       and optional {@code pictureUrl}.</li>
 *   <li><b>POST /logout</b> is handled by Spring Security (see SecurityConfig). Prefer that over the legacy API logout.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    private final AppUserRepository appUserRepository;

    public AuthController(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    /**
     * DTO for authenticated user profile response.
     * Exposes only non-sensitive fields, shaped exactly for the FE.
     */
    public record AppUserProfileDTO(
            String email,
            String fullName,
            String role,
            String pictureUrl
    ) {}

    /**
     * Returns the authenticated user's profile.
     *
     * <p>Source of truth for identity:
     * <ol>
     *   <li>Read Google's {@code email} from the OAuth2 principal.</li>
     *   <li>Load our {@link AppUser} by email (created on first login in the success handler).</li>
     *   <li>Shape the response as {@code { email, fullName, role, pictureUrl? }}.</li>
     * </ol>
     *
     * <p>401 is returned if the principal is missing or the user is not found.</p>
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

        // Optional: pull Google picture/ avatar if present
        String picture = principal.getAttribute("picture");

        return new AppUserProfileDTO(
                user.getEmail(),
                user.getName(),              // map to fullName
                user.getRole().name(),       // single role string
                picture
        );
    }
    /**
     * Returns the caller's granted authorities (e.g., ROLE_USER, ROLE_ADMIN).
     *
     * <p>We inject the authenticated principal ({@link OAuth2User}) directly via
     * {@link org.springframework.security.core.annotation.AuthenticationPrincipal}.
     * This is the correct way to access authorities for the current user in a controller;
     * using {@code @AuthenticationPrincipal Authentication} will typically resolve to {@code null}.</p>
     *
     * @return list of authority strings (never {@code null})
     * @throws ResponseStatusException 401 if no authenticated principal is present
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
     * API logout endpoint.
     * Invalidates the Spring Security session and expires cookies.
     * Intended for API clients (e.g. Postman); prefer the POST /logout handled by Spring Security for browsers.
     * Returns 204 No Content.
     * @param request  HTTP servlet request
     * @param response HTTP servlet response
     * @return ResponseEntity with no content
     * @see org.springframework.security.web.authentication.logout.LogoutSuccessHandler
     **/
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> apiLogout(HttpServletRequest request, HttpServletResponse response) {
        // Invalidate Spring Security session
        new SecurityContextLogoutHandler().logout(request, response, null);

        // Expire session cookies explicitly for API clients (what the test expects)
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