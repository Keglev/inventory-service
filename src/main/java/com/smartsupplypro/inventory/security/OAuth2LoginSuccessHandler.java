package com.smartsupplypro.inventory.security;

import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

import java.util.Optional;
import java.util.logging.Logger;

/**
 * OAuth2LoginSuccessHandler handles user onboarding and redirection
 * after successful Google OAuth2 login.
 *
 * <p>This component is automatically triggered by Spring Security when a
 * user logs in via an external OAuth2 provider (e.g., Google). If the user
 * does not yet exist in the local database, it creates a new {@link AppUser}
 * with default {@link Role#USER} privileges.
 *
 * <p>All user identities are based on the unique email address returned
 * by the OAuth2 provider. After successful login and registration,
 * the user is redirected to the frontend (e.g., Vite-based SPA).
 *
 * <p>Note: This handler does not expose any REST endpoint and is purely part
 * of the Spring Security backend flow.
 *
 * @author Carlos K.
 * @version 1.0
 * @since 2025-07-30
 */
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private AppUserRepository userRepository;

    private static final Logger LOGGER = Logger.getLogger(OAuth2LoginSuccessHandler.class.getName());

    /**
     * Callback method invoked after a successful OAuth2 authentication.
     *
     * <p>This method extracts the user's email and name from the OAuth2 token,
     * checks if the user already exists in the database, and creates a new user
     * with role {@code USER} if not found.
     *
     * @param request        the incoming HTTP request
     * @param response       the outgoing HTTP response
     * @param authentication the authentication object containing OAuth2 user details
     * @throws IOException        in case of I/O errors
     * @throws ServletException   in case of general servlet-related errors
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
            LOGGER.severe("OAuth2 provider did not return email or name.");
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }

        try {
            // Register the user if they don't exist
            Optional<AppUser> existing = userRepository.findById(email);
            if (existing.isEmpty()) {
                AppUser newUser = new AppUser(email, name);
                newUser.setRole(Role.USER);
                newUser.setCreatedAt(LocalDateTime.now());
                userRepository.save(newUser);
                LOGGER.info("New user registered via OAuth2: " + email);
            }
        } catch (DataIntegrityViolationException e) {
            LOGGER.warning("Duplicate user detected during OAuth2 login: " + email);
            userRepository.findByEmail(email).orElseThrow(() ->
                    new IllegalStateException("User already exists but cannot be loaded."));
        }

        // ✅ Important: Ensure redirect uses proper protocol and host
        response.sendRedirect("http://localhost:5173/login");
    }
}
