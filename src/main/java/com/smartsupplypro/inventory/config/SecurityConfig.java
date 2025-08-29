package com.smartsupplypro.inventory.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.util.List;

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

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Global Spring Security configuration for the SmartSupplyPro backend application.
 *
 * <p><b>Responsibilities</b></p>
 * <ul>
 *   <li>Session-based OAuth2 login (Google) with custom success/failure handling.</li>
 *   <li>Role-based authorization for REST APIs (JSON APIs under <code>/api/**</code>).</li>
 *   <li>Browser UX: unauthenticated <i>web</i> requests are redirected to OAuth login; JSON API requests receive <code>401</code>.</li>
 *   <li>CORS for cross-domain frontend (SameSite=None, Secure cookies).</li>
 * </ul>
 *
 * <p><b>Security Notes</b></p>
 * <ul>
 *   <li>CSRF is disabled globally as a portfolio simplification. For production, prefer enabling CSRF and
 *       ignoring it for REST endpoints (<code>/api/**</code>) only.</li>
 *   <li>Logout deletes both servlet and Spring Session cookies (<code>JSESSIONID</code>, <code>SESSION</code>).</li>
 *   <li>New-user self-enrollment flows are intentionally out of scope; onboarding is handled by the OAuth2 success handler.</li>
 * </ul>
 *
 * <p><b>Related</b></p>
 * <ul>
 *   <li>{@link com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler} – user bootstrap + post-login redirect.</li>
 *   <li>{@link com.smartsupplypro.inventory.config.TestSecurityConfig} – simplified test-only chain for controller tests.</li>
 * </ul>
 *
 * @since 2025-08
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    /**
     * Injected OAuth2 success handler that creates a local {@code AppUser} on first login
     * and performs the frontend redirect.
     */
    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    /**
     * Main security filter chain wiring: CORS, endpoint rules, OAuth2 login, session and exception handling.
     *
     * <p><b>API vs Browser failures:</b> a small pre-filter flags JSON API calls (Accept contains
     * <code>application/json</code> under <code>/api/**</code>). Those requests receive a JSON <code>401</code>
     * via a custom entry point, while all other unauthenticated requests use a login redirect.</p>
     *
     * @param http HttpSecurity builder
     * @return configured SecurityFilterChain
     * @throws Exception if misconfigured
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        // Flags JSON API requests so we can return 401 (not a redirect) on auth failures.
        OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain)
                    throws ServletException, IOException {
                String accept = req.getHeader("Accept");
                // Flag API requests that accept JSON, so we can handle them differently later
                if (req.getRequestURI().startsWith("/api/")
                        && accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", true);
                }
                chain.doFilter(req, res);
            }
        };
        // Request matcher to identify API requests based on the custom attribute set by the filter
        RequestMatcher apiMatcher = request -> Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));
        // Entry point for API requests that should return JSON 401 instead of redirecting
        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };
        // Entry point for web requests that should redirect to the login page
        AuthenticationEntryPoint webEntry = new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");
        // Main security configuration
        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .cors(Customizer.withDefaults())
            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/actuator/**", "/health/**").permitAll()
                // Allow OAuth2 endpoints and error page to avoid redirect loops
                .requestMatchers("/oauth2/**", "/login/oauth2/**", "/login/**", "/error").permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                .requestMatchers("/api/analytics/**").hasAnyRole("USER","ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)         // JSON APIs -> 401 JSON
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)    // everything else -> redirect
            )
            .oauth2Login(oauth -> oauth // OAuth2 login configuration
                .failureHandler(oauthFailureHandler())
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
                // Delete both cookies; Spring Session uses "SESSION", servlet container uses "JSESSIONID"
                .deleteCookies("JSESSIONID", "SESSION")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED) // Use session only if needed
            )
            // Portfolio simplification: CSRF disabled. For production, enable CSRF and ignore for /api/**.
            .csrf(csrf -> csrf.disable());

        return http.build();
    }

    /**
     * CORS settings for cross-origin frontend access with credentialed cookies.
     *
     * <p><b>Important:</b> When {@code allowCredentials=true}, wildcards are not permitted.
     * The origin must be explicitly listed and must match exactly. Preflight responses are cached
     * for one hour.</p>
     *
     * <ul>
     *   <li>Dev: Vite default <code>http://localhost:5173</code> (HTTPS variant listed if you use it).</li>
     *   <li>Prod: set to your Fly frontend domain.</li>
     *   <li>Methods: GET/POST/PUT/PATCH/DELETE/OPTIONS; headers: all.</li>
     * </ul>
     *
     * @return {@link CorsConfigurationSource} used by Spring Security’s CORS filter
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",               // Dev (Vite default)
            "https://localhost:5173",              // Dev over HTTPS (if used)
            "https://inventoryfrontend.fly.dev"    // Prod frontend domain (adjust on go-live)
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Set-Cookie"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * Session cookie settings for cross-site use.
     *
     * <p>Sets <code>SameSite=None</code> and <code>Secure</code> so cookies can be sent with
     * cross-site requests over HTTPS. When Spring Session is on the classpath, the cookie
     * name defaults to <code>SESSION</code>; otherwise the container uses <code>JSESSIONID</code>.</p>
     *
     * <p><b>Development note:</b> Browsers only send <code>Secure</code> cookies over HTTPS.
     * If your frontend runs on plain HTTP in development, the cookie will not be stored/sent.
     * Use HTTPS locally (e.g., mkcert) or adjust in a dev-only profile.</p>
     *
     * @return cookie serializer for Spring Session (no-op if Spring Session is absent)
     */
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setSameSite("None");
        serializer.setUseSecureCookie(true);
        serializer.setCookiePath("/");
        return serializer;
    }

    /**
     * Redirect-based handler for OAuth2 login failures.
     *
     * <p>Encodes the error message and redirects to <code>/login</code> with a query parameter
     * (<code>?error=...</code>) for UI display. The frontend is responsible for parsing and showing it.</p>
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
