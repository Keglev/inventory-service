package com.smartsupplypro.inventory.controller;

import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

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
    public ResponseEntity<AppUser> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "No authentication provided");
        }
        // Extract email from the OAuth2 principal
        String email = principal.getAttribute("email");
        if (email == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided by OAuth2 provider");
        }

        return appUserRepository.findById(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    /**
     * Temporary debug endpoint to inspect session and authentication state.
     *
     * <p>This endpoint is useful for diagnosing session-related issues between the frontend
     * and backend. It logs the HTTP session ID and prints authentication state to the console.
     * 
     * <p><strong>Warning:</strong> This endpoint should not be exposed in production environments.
     *
     * @param authentication Spring Security {@link Authentication} object
     * @param request        current {@link HttpServletRequest} to extract session info
     * @return JSON response indicating whether the user is authenticated
     */
    @GetMapping("/me-debug")
    public ResponseEntity<?> getCurrentUserDebug(Authentication authentication, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        System.out.println(">>> /api/me-debug HIT");
        System.out.println("SESSION ID: " + (session != null ? session.getId() : "null"));
        System.out.println("AUTH: " + authentication);
        // Print authentication details to console for debugging
        return authentication != null
                ? ResponseEntity.ok(Collections.singletonMap("principal", authentication.getPrincipal()))
                : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
    }

}
