package com.smartsupplypro.inventory.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
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
 * Authentication utility endpoints.
 *
 * <p><b>Responsibilities</b>
 * <ul>
 *   <li>Expose the authenticated user profile at <code>GET /api/me</code>.</li>
 *   <li>Optional debug endpoints for session/auth inspection (not for production).</li>
 * </ul>
 *
 * <p><b>Security</b>
 * <ul>
 *   <li>All endpoints are under <code>/api/**</code> and require authentication,
 *       except where explicitly opened in {@code SecurityConfig}.</li>
 *   <li>On missing/invalid authentication, the controller returns 401 with a JSON body
 *       (driven by the API entry point in {@code SecurityConfig}).</li>
 * </ul>
 *
 * <p><b>Notes</b>
 * <ul>
 *   <li>User lookup is by OAuth2-provided email. No self-enrollment UI is provided.</li>
 *   <li>Debug endpoints should be disabled in production builds.</li>
 * </ul>
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AppUserRepository appUserRepository;

    /* 
    * DTO for authenticated user profile response.
    * Exposes only non-sensitive fields.
    */
    public record AppUserProfileDTO(
            String id, String email, String name, String pictureUrl, List<String> roles) {}

    /**
     * Retrieves the full authenticated user profile using the OAuth2 principal.
     *
     * <p>This endpoint:
     * <ul>
     *   <li>Requires the user to be authenticated via Google OAuth2</li>
     *   <li>Extracts the user email from the OAuth2 principal</li>
     *   <li>Fetches the full user profile from the internal {@code AppUserRepository}</li>
     * </ul>
     *
     * @param principal OAuth2 principal injected by Spring Security
     * @return authenticated {@link AppUser} profile or HTTP 401 if authentication is missing
     */
    @GetMapping("/me")
    public AppUserProfileDTO me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication provided");
        String email = principal.getAttribute("email");
        if (email == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided by OAuth2 provider");

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        return new AppUserProfileDTO(user.getId(), user.getEmail(), user.getName(), null,
                List.of(user.getRole().name()));
    }

    /**
     * Logout endpoint to invalidate the user session.
     * 
     * <p>This endpoint:
     * <ul>
     *  <li>Invalidates the current HTTP session</li>
     * <li>Clears the security context</li>
     * <li>Removes session cookies</li>
     * <li>Returns HTTP 204 No Content on success</li>
     * </ul>
     * </p>
     * @param request  the incoming HTTP request
     * @param response the outgoing HTTP response
     * @return HTTP 204 No Content on successful logout
     */
    @PostMapping("/auth/logout")
    public ResponseEntity<Void> apiLogout(HttpServletRequest request, HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, null);
        ResponseCookie jsess = ResponseCookie.from("JSESSIONID","").path("/").maxAge(0)
                .httpOnly(true).secure(true).sameSite("None").build();
        ResponseCookie session = ResponseCookie.from("SESSION","").path("/").maxAge(0)
                .httpOnly(true).secure(true).sameSite("None").build();
        response.addHeader("Set-Cookie", jsess.toString());
        response.addHeader("Set-Cookie", session.toString());
        return ResponseEntity.noContent().build(); // 204
    }

}
