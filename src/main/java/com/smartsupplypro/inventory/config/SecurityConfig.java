package com.smartsupplypro.inventory.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;
import java.util.List;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Central security configuration class using Spring Security.
 * 
 * <p>This class defines:
 * <ul>
 *   <li>OAuth2 login using Google with a custom success handler</li>
 *   <li>Role-based access control for secured REST endpoints</li>
 *   <li>Custom API-aware authentication entry points for consistent behavior (JSON vs redirect)</li>
 *   <li>CSRF disabled for stateless REST communication</li>
 * </ul>
 *
 * <p>Designed for a microservice-based architecture with frontend/backend separation.
 * All security logic is encapsulated in a single, modular, and testable configuration.
 */
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@Configuration
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    /**
     * Defines the security rules and authentication flow for HTTP requests.
     *
     * @param http HttpSecurity instance provided by Spring Security
     * @return configured security filter chain
     * @throws Exception in case of misconfiguration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Filter that flags API requests based on URI prefix and Accept header
        // This is used to differentiate REST clients from browser-based clients
        OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain)
                    throws ServletException, IOException {

                String accept = req.getHeader("Accept");
                if (req.getRequestURI().startsWith("/api/") &&
                    accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", true);
                }

                chain.doFilter(req, res);
            }
        };

        // Register the custom filter before pre-authentication phase
        http.addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class);

        // Matcher to identify flagged API requests
        RequestMatcher apiMatcher = request ->
                Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

        // For API requests, return JSON error instead of redirect
        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        // For browser-based requests, trigger OAuth2 login
        AuthenticationEntryPoint webEntry =
                new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

        // Configure endpoint access and authentication logic
        http
        // Enable CORS support for cross-origin requests
            .cors(cors -> {})
            
            // Define security rules for HTTP requests
            .authorizeHttpRequests(auth -> auth

                // Public endpoints (e.g., root and health checks)
                // - "/health/**" is implemented via HealthCheckController
                // - "/actuator/**" is not used currently, but allowed for future expansion
                .requestMatchers("/", "/actuator/**", "/health/**").permitAll()

                // Admin-only endpoints
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")

                // General authenticated access for all other /api routes
                .requestMatchers("/api/**").authenticated()

                // All other requests require authentication by default
                .anyRequest().authenticated()
            )
            // Entry points depending on request type (API vs web)
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)
            )
            // OAuth2 login integration with Google
            // This will redirect to Google for authentication
            // and use a custom success handler to redirect back to the SPA
            .oauth2Login(oauth -> oauth
                .successHandler(successHandler)
            )
                
            // Redirect to root after logout and clear cookies
            // This is important for SPA applications to reset state
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )

            // Disable CSRF for RESTful API (stateless communication)
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
    /**
    * Defines the CORS policy for cross-origin requests between frontend and backend.
    *
    * <p>This setup is required to:
    * <ul>
    *   <li>Allow session cookies (e.g., JSESSIONID) for OAuth2 and authenticated requests</li>
    *   <li>Enable secure interaction from a frontend hosted on a different domain (e.g., Vite dev server or Fly.io frontend)</li>
    * </ul>
    *
    * <p><strong>Note:</strong> Allowing credentials requires an explicit origin — wildcards (*) are not permitted.
    *
    * @return configured CorsConfigurationSource bean for Spring Security
    */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Replace with your actual frontend origins (you can add more as needed)
        config.setAllowedOrigins(List.of("http://localhost:5173", "https://your-frontend-domain.fly.dev"));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));

        // Critical for session-based auth (OAuth2 cookies, JSESSIONID)
        config.setAllowCredentials(true);

        config.setMaxAge(3600L); // Cache CORS config for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
