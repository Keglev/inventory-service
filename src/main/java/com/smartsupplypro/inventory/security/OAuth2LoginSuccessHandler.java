package com.smartsupplypro.inventory.security;

import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Custom OAuth2 login success handler for processing authenticated users.
 *
 * <p>This handler is triggered upon successful login via an external OAuth2 provider
 * (e.g., Google). If the user does not already exist in the system, a new {@link AppUser}
 * is automatically registered with default {@code USER} role.
 *
 * <p>Logs and audits newly registered users in the database and lets Spring Security
 * proceed with its post-login redirection flow.
 *
 * <p><strong>Note:</strong> This handler does not expose an API endpoint but can be
 * described in architectural documentation or a login sequence diagram if needed.
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private AppUserRepository userRepository;

    /**
     * Handles the logic after a successful OAuth2 login.
     * - Extracts user details from the authentication token
     * - Saves new users into the system if they don’t already exist
     * - Assigns default {@link Role#USER}
     *
     * @param request        the HTTP request
     * @param response       the HTTP response
     * @param authentication the OAuth2 authentication object
     * @throws IOException      on IO errors
     * @throws ServletException on servlet errors
     */
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");

        if (email == null || name == null) {
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }

        // Register the user if not found in DB
        userRepository.findById(email).orElseGet(() -> {
            AppUser user = new AppUser(email, name);
            user.setRole(Role.USER);
            user.setCreatedAt(LocalDateTime.now());
            System.out.println(">>> Saving new user: " + user.getEmail() + ", role = [" + user.getRole() + "]");
            return userRepository.save(user);
        });

        // Continue default flow (e.g., redirect to default target URL)
        super.onAuthenticationSuccess(request, response, authentication);
    }
}
// This code handles the OAuth2 login success scenario, registering new users if they do not exist in the database.
