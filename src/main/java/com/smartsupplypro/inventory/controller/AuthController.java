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

@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AppUserRepository appUserRepository;

    /**
     * Returns the profile of the currently authenticated OAuth2 user.
     * This requires the user to be logged in via Google OAuth2 and previously saved in the DB.
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