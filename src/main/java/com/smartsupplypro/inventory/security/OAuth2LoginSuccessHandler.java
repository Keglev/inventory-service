package com.smartsupplypro.inventory.security;

import java.io.IOException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

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
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Enterprise OAuth2 authentication success handler with automatic user provisioning.
 * 
 * <p>Handles post-authentication user onboarding and secure frontend redirection
 * after successful Google OAuth2 login. Creates local user accounts with default
 * permissions and manages cross-origin redirect security.</p>
 * 
 * <p><strong>Enterprise Features:</strong> Automatic user provisioning, concurrent
 * login safety, configurable frontend redirects, and origin allowlist security.</p>
 */

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    private static final org.slf4j.Logger log =
    org.slf4j.LoggerFactory.getLogger(OAuth2LoginSuccessHandler.class);
    /** Application properties for frontend URL configuration and environment settings. */
    private final AppProperties props;
    
    /** User repository for automatic user provisioning and duplicate detection. */
    private final AppUserRepository userRepository;
    
    /** Constructor with dependency injection for configuration and data access. */
    public OAuth2LoginSuccessHandler(AppProperties props, AppUserRepository userRepository) {
        this.props = props;
        this.userRepository = userRepository;
    }
    
    /**
     * Handles successful OAuth2 authentication with automatic user provisioning.
     * 
     * <p>Extracts user credentials from OAuth2 token, creates local user account
     * if needed, and redirects to configured frontend URL with origin allowlist security.</p>
     * 
     * <p><strong>Enterprise Security:</strong> Prevents duplicate redirects, validates
     * return URLs against allowlist, and handles concurrent login scenarios safely.</p>
     */
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
    HttpServletResponse response,
    Authentication authentication)
    throws IOException, ServletException {
        
        // Enterprise Security: Prevent duplicate redirects in concurrent authentication scenarios
        if (request.getAttribute("OAUTH2_SUCCESS_REDIRECT_DONE") != null) {
            log.debug("Success redirect already performed; skipping.");
            return;
        }
        request.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", Boolean.TRUE);
        
        // Enterprise Identity: Extract user credentials from OAuth2 token for local provisioning
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");
        
        if (email == null || name == null) {
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }
        
        try {
            // Enterprise Provisioning: Automatic user creation with default role assignment
            userRepository.findById(email).orElseGet(() -> {
                AppUser newUser = new AppUser(email, name);
                newUser.setRole(Role.USER);  // Enterprise default: USER role for OAuth2 users
                newUser.setCreatedAt(LocalDateTime.now());
                return userRepository.save(newUser);
            });
        } catch (DataIntegrityViolationException e) {
            // Enterprise Concurrency: Handle race conditions in multi-instance deployments
            userRepository.findByEmail(email).orElseThrow(() ->
            new IllegalStateException("User already exists but cannot be loaded."));
        }
        
        // Enterprise Redirect Security: Origin allowlist prevents open redirect attacks
        List<String> allowed = List.of(
        "http://localhost:5173",     // Development environment
        "https://localhost:5173",    // Development HTTPS
        props.getFrontend().getBaseUrl() // Production frontend from configuration
        );
        // Enterprise Configuration: Environment-specific post-login landing page
        String target = props.getFrontend().getBaseUrl() + props.getFrontend().getLandingPath();
        
        // Enterprise Return URL: Check for custom return destination with security validation
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("SSP_RETURN".equals(c.getName())) {
                    String candidate = c.getValue();
                    if (candidate != null && allowed.contains(candidate)) {
                        target = candidate + "/auth";  // Enterprise routing: custom post-auth destination
                    }
                    // Enterprise Cleanup: Remove single-use return URL cookie
                    Cookie clear = new Cookie("SSP_RETURN", "");
                    clear.setPath("/");
                    clear.setMaxAge(0);
                    clear.setSecure(isSecureOrForwardedHttps(request));
                    clear.setHttpOnly(false); // Frontend created it non-HttpOnly
                    addCookieWithSameSite(response, clear, "None");
                    break;
                }
            }
        }
        log.info("OAuth2 success → redirecting to FE: {}", target);
        setAlwaysUseDefaultTargetUrl(true);
        setDefaultTargetUrl(URI.create(target).toString());
        // Enterprise Flow: Single redirect execution via parent handler
        super.onAuthenticationSuccess(request, response, authentication);
    }
    
    /**
     * Enterprise Security: Detects HTTPS context including load balancer forwarding.
     * Supports both direct HTTPS and X-Forwarded-Proto header detection.
     */
    private static boolean isSecureOrForwardedHttps(HttpServletRequest request) {
        if (request.isSecure()) return true;
        String xfProto = request.getHeader("X-Forwarded-Proto");
        return xfProto != null && xfProto.equalsIgnoreCase("https");
    }
    
    /**
     * Enterprise Cookie Security: Adds SameSite attribute for cross-origin compatibility.
     * Essential for OAuth2 flows between frontend and backend on different domains.
     */
    private static void addCookieWithSameSite(HttpServletResponse response, Cookie cookie, String sameSite) {
        StringBuilder sb = new StringBuilder();
        sb.append(cookie.getName()).append('=').append(cookie.getValue() == null ? "" : cookie.getValue());
        sb.append("; Path=").append(cookie.getPath() == null ? "/" : cookie.getPath());
        if (cookie.getMaxAge() >= 0) sb.append("; Max-Age=").append(cookie.getMaxAge());
        if (cookie.getSecure()) sb.append("; Secure");
        if (cookie.isHttpOnly()) sb.append("; HttpOnly");
        if (sameSite != null && !sameSite.isBlank()) sb.append("; SameSite=").append(sameSite);
        response.addHeader("Set-Cookie", sb.toString());
    }
}
