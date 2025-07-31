package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.Authentication;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Collections;

/**
 * Controller for retrieving authentication-related data.
 *
 * <p>This controller provides access to the currently authenticated user's profile.
 * It is designed to support OAuth2 login scenarios (e.g., Google OAuth) and
 * backend identity verification within a microservice environment.
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

        return authentication != null
                ? ResponseEntity.ok(Collections.singletonMap("principal", authentication.getPrincipal()))
                : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
    }
    /**
     * Debug endpoint to inspect authentication state.
     *
     * <p>This endpoint is useful for diagnosing issues with authentication and session management.
     * It prints the session ID and authentication details to the console.
     *
     * @param auth    Spring Security {@link Authentication} object
     * @param request current {@link HttpServletRequest} to extract session info
     * @return JSON response indicating whether the user is authenticated
     */
    @GetMapping("/api/me-debug")
    public ResponseEntity<?> debugAuth(Authentication auth, HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        System.out.println("SESSION ID: " + (session != null ? session.getId() : "null"));
        System.out.println("AUTH: " + auth);
        if (auth != null) {
            System.out.println("AUTH CLASS: " + auth.getClass());
            System.out.println("PRINCIPAL: " + auth.getPrincipal());
        }
        return auth != null
            ? ResponseEntity.ok(auth.getPrincipal())
            : ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not authenticated");
    }

}
