package com.smartsupplypro.inventory.config;

import java.util.List;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import jakarta.servlet.http.HttpServletResponse;

/**
 * Enterprise OAuth2 security configuration with role-based access control.
 * 
 * <p>Implements session-based Google OAuth2 authentication with stateless authorization
 * request persistence, role-based API authorization, and cross-origin request support.</p>
 * 
 * <p><strong>Enterprise Features:</strong> OAuth2 login with custom user provisioning,
 * dual authentication entry points (API vs browser), CORS with secure cookies,
 * demo mode read-only access, and comprehensive session management.</p>
 * 
 * <p><strong>Demo Mode Integration:</strong> Uses SpEL expressions with {@code @appProperties.demoReadonly}
 * for conditional read-only access. See {@link SecuritySpelBridgeConfig} for SpEL bridge setup.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    
    /** OAuth2 authentication success handler for user provisioning. */
    @Autowired
    private OAuth2LoginSuccessHandler successHandler;

    /** Security filter helper for API request detection. */
    @Autowired
    private SecurityFilterHelper filterHelper;

    /** Security entry point helper for authentication failure handling. */
    @Autowired
    private SecurityEntryPointHelper entryPointHelper;

    /** Security authorization helper for request authorization rules. */
    @Autowired
    private SecurityAuthorizationHelper authorizationHelper;

    /** Custom OIDC user service for Google OAuth2. */
    @Autowired
    private com.smartsupplypro.inventory.service.CustomOidcUserService customOidcUserService;

    /** Custom OAuth2 user service for non-OIDC providers. */
    @Autowired
    private com.smartsupplypro.inventory.service.CustomOAuth2UserService customOAuth2UserService;

    /** Application properties for demo mode and frontend URLs. */
    @Autowired
    private AppProperties props;

    /**
     * Primary security filter chain with OAuth2 and role-based authorization.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        OncePerRequestFilter apiFlagFilter = filterHelper.createApiDetectionFilter();
        RequestMatcher apiMatcher = request -> Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));
        AuthenticationEntryPoint apiEntry = entryPointHelper.createApiEntryPoint();
        AuthenticationEntryPoint webEntry = entryPointHelper.createWebEntryPoint(props.getFrontend().getBaseUrl());
        // Main security configuration
        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> authorizationHelper.configureAuthorization(auth, props.isDemoReadonly()))

            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)
            )
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ae -> ae.authorizationRequestRepository(authorizationRequestRepository()))
                .userInfoEndpoint(ui -> ui.oidcUserService(customOidcUserService).userService(customOAuth2UserService))
                .failureHandler(oauthFailureHandler(props))
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler((req, res, auth) -> {
                    boolean isApi = Boolean.TRUE.equals(req.getAttribute("IS_API_REQUEST"));
                    if (isApi) {
                        res.setStatus(HttpServletResponse.SC_NO_CONTENT);
                        return;
                    }
                    String base = props.getFrontend().getBaseUrl();
                    String ret  = req.getParameter("return");
                    String target = base + "/logout-success";
                    if (ret != null && ret.startsWith(base)) {
                        target = ret;
                    }
                    res.sendRedirect(target);
                })
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "SESSION")
                .permitAll()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/logout", "/actuator/**"));
        return http.build();
    }

    /**
     * CORS configuration for cross-origin frontend access with secure cookies.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://localhost:5173",
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

    /**
     * Session cookie configuration for cross-site authentication.
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
     * OAuth2 authentication failure handler with frontend redirect.
     */
    @Bean
    public AuthenticationFailureHandler oauthFailureHandler(AppProperties props) {
        return (request, response, exception) -> {
            LoggerFactory.getLogger(SecurityConfig.class).warn("OAuth2 failure: {}", exception.toString());
            String target = props.getFrontend().getBaseUrl() + "/login?error=oauth";
            if (!response.isCommitted()) response.sendRedirect(target);
        };
    };

    /**
     * Stateless OAuth2 authorization request repository using secure cookies.
     */
    @Bean
    public AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository() {
        return new CookieOAuth2AuthorizationRequestRepository();
    }
};
