package com.smartsupplypro.inventory.config;

import java.io.IOException;
import java.util.List;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.OncePerRequestFilter;

import com.smartsupplypro.inventory.security.CookieOAuth2AuthorizationRequestRepository;
import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    
    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    @Autowired
    private com.smartsupplypro.inventory.service.CustomOidcUserService customOidcUserService;

    @Autowired
    private com.smartsupplypro.inventory.service.CustomOAuth2UserService customOAuth2UserService;

    @Autowired
    private AppProperties props;

    
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
        AuthenticationEntryPoint webEntry = (req, res, ex) -> {
            String target = props.getFrontend().getBaseUrl() + "/login";
            res.sendRedirect(target);
        };
        // Main security configuration
        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .cors(Customizer.withDefaults())

            // ---------- AUTHZ RULES (block form) ----------
            .authorizeHttpRequests(auth -> {

                // 1) Allow CORS preflight requests to pass through the security filter
                auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll(); // allow preflight requests globally
                auth.requestMatchers("/logout").permitAll();
                // Public (always)
                auth.requestMatchers(
                        "/", "/actuator/**", "/health/**",
                        "/oauth2/**", "/login/oauth2/**", "/login/**", "/error"
                ).permitAll();

                // 2) Demo mode: allow read-only endpoints without login
                if (props.isDemoReadonly()) { // using the getter (with parentheses)
                    auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").permitAll();
                }

                // 3) Default (non-demo): any signed-in user may READ these resources
                auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").authenticated();
                auth.requestMatchers(HttpMethod.GET, "/api/suppliers/**").authenticated();
                auth.requestMatchers(HttpMethod.GET, "/api/analytics/**").authenticated();

                // 4) Admin-only area stays role-protected
                auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.POST, "/api/inventory/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.PUT, "/api/inventory/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.PATCH, "/api/inventory/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.DELETE, "/api/inventory/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.POST, "/api/suppliers/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.PUT, "/api/suppliers/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.PATCH, "/api/suppliers/**").hasRole("ADMIN");
                auth.requestMatchers(HttpMethod.DELETE, "/api/suppliers/**").hasRole("ADMIN");

                // 5) Everything else under /api/** must at least be authenticated
                auth.requestMatchers("/api/**").authenticated();

                // 6) Anything else authenticated as well (e.g., app shell)
                auth.anyRequest().authenticated();
            })
            // ----------------------------------------------

            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)      // JSON APIs -> 401 JSON
                .defaultAuthenticationEntryPointFor(webEntry, request -> true) // everything else -> redirect
            )
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ae -> ae
                    // Store the outbound authorization request in a cookie so the callback
                    // can be processed by any instance (no sticky sessions required).
                    .authorizationRequestRepository(authorizationRequestRepository())
                )
                .userInfoEndpoint(ui -> ui
                    // OIDC path (Google): use the OIDC service that returns an OidcUser
                    .oidcUserService(customOidcUserService)
                    // Non-OIDC OAuth2 providers (if you ever add one): keep your existing service
                    .userService(customOAuth2UserService)
                )
                .failureHandler(oauthFailureHandler(props))
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler((req, res, auth) -> {
                    boolean isApi = Boolean.TRUE.equals(req.getAttribute("IS_API_REQUEST"));
                    if (isApi) {
                        res.setStatus(HttpServletResponse.SC_NO_CONTENT); // 204 for XHR/API
                        return;
                    }
                    // Support FE form-post with ?return=<absolute-url>, but guard against open redirects
                    String base = props.getFrontend().getBaseUrl();                  // e.g., https://your-fe.example
                    String ret  = req.getParameter("return");                  // e.g., https://your-fe.example/logout-success
                    String target = base + "/logout-success";
                    if (ret != null && ret.startsWith(base)) {                     // simple allowlist: must start with FE base
                        target = ret;
                    }
                    res.sendRedirect(target);
                })
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "SESSION")
                .permitAll() // explicit: anyone can hit /logout (it only clears if there is a session)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
            )
            // For production, prefer enabling CSRF and ignoring it for /api/** only:
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/logout", "/actuator/**"));
        return http.build();
    }

    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            // Dev (Vite default)
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            // Dev over HTTPS (only if actually use mkcert/HTTPS locally)
            "https://localhost:5173",             
            // Production Frontend (in this case, Koyeb frontend domain)
            "https://inventory-service.koyeb.app"   
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

    
    @Bean
    public CookieSerializer cookieSerializer() {
        DefaultCookieSerializer serializer = new DefaultCookieSerializer();
        serializer.setSameSite("None");
        serializer.setUseSecureCookie(true);
        serializer.setCookiePath("/");
        return serializer;
    }

    @Bean
    public AuthenticationFailureHandler oauthFailureHandler(AppProperties props) {
        return (request, response, exception) -> {
            // Optional but useful log:
            LoggerFactory.getLogger(SecurityConfig.class).warn("OAuth2 failure: {}", exception.toString());
            String target = props.getFrontend().getBaseUrl() + "/login?error=oauth";
            if (!response.isCommitted()) response.sendRedirect(target);
        };
    };

    
    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new CookieOAuth2AuthorizationRequestRepository();
    }
};
