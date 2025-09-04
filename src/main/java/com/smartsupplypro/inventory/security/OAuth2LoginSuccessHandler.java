package com.smartsupplypro.inventory.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * OAuth2LoginSuccessHandler handles user onboarding and redirection
 * after successful Google OAuth2 login.
 *
 * <p><b>Flow</b>
 * <ol>
 *   <li>Extracts <code>email</code> and <code>name</code> from the OAuth2 principal.</li>
 *   <li>Creates a local {@link AppUser} with {@link Role#USER} if none exists.</li>
 *   <li>Redirects the browser to the frontend login landing page.</li>
 * </ol>
 *
 * <p><b>Contract</b>
 * <ul>
 *   <li>Identity is keyed by unique email.</li>
 *   <li>Duplicate detection defends against concurrent logins (DB unique constraint).</li>
 *   <li>Redirect target should be environment-configurable for dev/prod.</li>
 * </ul>
 *
 * <p><b>Out of scope</b>: self-service enrollment flows/UI.</p>
 */

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);
    private final AppProperties props;
    private final AppUserRepository userRepository;

    public OAuth2LoginSuccessHandler(AppProperties props, AppUserRepository userRepository) {
        this.props = props;
        this.userRepository = userRepository;
    }

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

            // Prevent duplicate redirects if something triggers success twice in the same request
        if (request.getAttribute("OAUTH2_SUCCESS_REDIRECT_DONE") != null) {
            log.debug("Success redirect already performed; skipping.");
            return;
        }
        request.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", Boolean.TRUE);

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");

        if (email == null || name == null) {
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }

        try {
            // Register the user if they don't exist
            userRepository.findById(email).orElseGet(() -> {
                AppUser newUser = new AppUser(email, name);
                newUser.setRole(Role.USER);
                newUser.setCreatedAt(LocalDateTime.now());
                return userRepository.save(newUser);
            });
        } catch (DataIntegrityViolationException e) {
            // Concurrent insert safety: load the already-created user
            userRepository.findByEmail(email).orElseThrow(() ->
                    new IllegalStateException("User already exists but cannot be loaded."));
        }
        // TO DO: Make redirect URL configurable (e.g., via property "app.frontend.baseUrl").
        // Hardcoding https://localhost:5173 will not work on production (Fly).
        // configurable post-login target
        String target = props.getFrontend().getBaseUrl() + props.getFrontend().getLandingPath();
        log.info("OAuth2 success → redirecting to FE: {}", target);
        // If something already wrote/redirected, bail

        setAlwaysUseDefaultTargetUrl(true);
        setDefaultTargetUrl(target);
        // ONE redirect only
        // Let the parent handler run the (single) redirect
        super.onAuthenticationSuccess(request, response, authentication);

        // Important: Ensure redirect uses proper protocol and host
        // response.sendRedirect("https://localhost:5173/login");
    }
}
