package com.smartsupplypro.inventory.controller;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api")
public class AuthController {
     @Autowired
    private AppUserRepository appUserRepository;

    @GetMapping("/me")
    public ResponseEntity<AppUser> getCurrentUser(OAuth2AuthenticationToken auth) {
        String email = auth.getPrincipal().getAttribute("email");

        if (email == null) {
        throw new ResponseStatusException(UNAUTHORIZED, "Email not provided by OAuth2 provider");
        }

        return appUserRepository.findById(email)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "User not found"));
    }
}
