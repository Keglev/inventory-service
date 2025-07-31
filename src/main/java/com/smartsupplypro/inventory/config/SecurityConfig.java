package com.smartsupplypro.inventory.config;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.List;

/**
 * Global Spring Security configuration for the SmartSupplyPro backend application.
 *
 * <p>This class centralizes security concerns including:
 * <ul>
 *   <li>OAuth2 login using Google with a custom success handler</li>
 *   <li>Session-based authentication with SameSite=None cookies</li>
 *   <li>Role-based access to secured REST endpoints</li>
 *   <li>Cross-origin request (CORS) configuration for frontend-backend communication</li>
 *   <li>Consistent handling of browser vs API authentication failures</li>
 * </ul>
 *
 * <p>Designed for stateless frontend-backend separation with session-based login support.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    /**
     * Configures the main security filter chain, including CORS, session management,
     * and endpoint access rules.
     *
     * @param http the {@link HttpSecurity} configuration object
     * @return the configured {@link SecurityFilterChain}
     * @throws Exception in case of misconfiguration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Filter to flag API requests (e.g., /api/**) that expect JSON responses
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

        RequestMatcher apiMatcher = request -> Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        AuthenticationEntryPoint webEntry = new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/actuator/**", "/health/**").permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)
            )
            .oauth2Login(oauth -> oauth
                .failureHandler(oauthFailureHandler())
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * Defines CORS settings to allow cross-origin requests between the frontend (e.g., Vite/React)
     * and this backend service. Enables session cookies for secure OAuth2 login flow.
     *
     * @return a CORS configuration source used by Spring Security
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(List.of(
            "https://localhost:5173",               // Local development frontend
            "https://inventoryfrontend.fly.dev"     // Production frontend domain (adjust when ready)
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Set-Cookie"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L); // cache for 1 hour

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Configures the session cookie to support cross-origin usage.
     * Sets SameSite=None and Secure=true, which is required when the frontend
     * and backend are on different domains and HTTPS is used.
     *
     * @return a cookie serializer used by Spring Session
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setSameSite("None");
        serializer.setUseSecureCookie(true);
        return serializer;
    }

    /**
     * Provides a redirect-based handler for OAuth2 login failures.
     * Appends the error message to the login page for frontend display.
     *
     * @return a configured {@link AuthenticationFailureHandler}
     */
    @Bean
    public AuthenticationFailureHandler oauthFailureHandler() {
        return (request, response, exception) -> {
            String encodedError = URLEncoder.encode(exception.getMessage(), "UTF-8");
            response.sendRedirect("/login?error=" + encodedError);
        };
    }
}
