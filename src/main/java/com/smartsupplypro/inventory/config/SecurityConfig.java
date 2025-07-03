package com.smartsupplypro.inventory.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.lang.NonNull;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Configures application-wide security rules using Spring Security.
 *
 * <p>Key Features:
 * <ul>
 *     <li>Enables OAuth2 login with Google</li>
 *     <li>Restricts access based on roles (USER/ADMIN)</li>
 *     <li>Allows public access to root and actuator endpoints</li>
 *     <li>Distinguishes between API and browser requests using a filter</li>
 *     <li>Customizes response format (JSON or redirect) based on request type</li>
 * </ul>
 *
 * <p>This is designed for a microservice environment with frontend/backend separation.
 */
@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    /**
     * Defines the security filter chain for all incoming HTTP requests.
     *
     * @param http the {@link HttpSecurity} object for configuring access rules
     * @return a configured {@link SecurityFilterChain}
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Custom filter to tag API requests based on Accept header and URI
        OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain)
                    throws ServletException, IOException {

                String accept = req.getHeader("Accept");
                System.out.println(">>> [Request URI] " + req.getRequestURI());
                System.out.println(">>> [Accept Header] " + accept);

                if (req.getRequestURI().startsWith("/api/")
                        && accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", true);
                    System.out.println(">>> [API FLAG SET] " + req.getRequestURI());
                }

                chain.doFilter(req, res);
            }
        };

        http.addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class);

        // Request matcher to identify flagged API requests
        RequestMatcher apiMatcher = request ->
                Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

        // API response for unauthenticated access: return JSON with 401
        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            System.out.println(">>> [API ENTRY POINT] " + req.getRequestURI());
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        // Web-based response (redirect to Google login page)
        AuthenticationEntryPoint webEntry =
                new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

        http
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/", "/actuator/**", "/health/**").permitAll()

                // Role-based API restrictions
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                .requestMatchers("/api/**").authenticated()

                // Default fallback: all other endpoints must be authenticated
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)
            )
            .oauth2Login(oauth -> oauth
                .loginPage("/oauth2/authorization/google")
                .successHandler(successHandler)
            )
            .logout(logout -> logout.logoutSuccessUrl("/"))
            .csrf(csrf -> csrf.disable()); // Disabled for API calls

        return http.build();
    }
}