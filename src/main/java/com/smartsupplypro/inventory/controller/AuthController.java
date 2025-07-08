package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

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
     * Returns the authenticated user's profile based on the OAuth2 principal.
     *
     * <p>This endpoint:
     * <ul>
     *   <li>Requires the user to be logged in via Google OAuth2</li>
     *   <li>Validates the presence of a valid email from the OAuth2 token</li>
     *   <li>Retrieves the full profile from the internal database (AppUser table)</li>
     * </ul>
     *
     * @param principal OAuth2 user information injected by Spring Security
     * @return the authenticated user's profile or 401 if unauthenticated or not found
     */
    @GetMapping("/me")
    public ResponseEntity<AppUser> getCurrentUser(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "No authentication provided");
        }

        String email = principal.getAttribute("email");
        if (email == null) {
            throw new ResponseStatusException(UNAUTHORIZED, "Email not provided by OAuth2 provider");
        }

        return appUserRepository.findById(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }
}
