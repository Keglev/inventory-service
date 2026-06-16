package com.smartsupplypro.inventory.config;

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
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

/**
 * Main security filter chain wiring OAuth2 login, authorization rules,
 * and dual-mode authentication entry points (API vs browser).
 *
 * <p>CORS and cookie settings live in {@link CorsConfig}; OAuth2 infrastructure beans
 * are in {@link OAuth2Config}; authorization rules are in {@link SecurityAuthorizationHelper}.</p>
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

    private final OAuth2LoginSuccessHandler successHandler;
    private final SecurityFilterHelper filterHelper;
    private final SecurityEntryPointHelper entryPointHelper;
    private final SecurityAuthorizationHelper authorizationHelper;
    private final CustomOidcUserService customOidcUserService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final AuthenticationFailureHandler oauthFailureHandler;
    private final AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository;
    private final AppProperties props;

    public SecurityConfig(
            OAuth2LoginSuccessHandler successHandler,
            SecurityFilterHelper filterHelper,
            SecurityEntryPointHelper entryPointHelper,
            SecurityAuthorizationHelper authorizationHelper,
            CustomOidcUserService customOidcUserService,
            CustomOAuth2UserService customOAuth2UserService,
            AuthenticationFailureHandler oauthFailureHandler,
            AuthorizationRequestRepository<OAuth2AuthorizationRequest> authorizationRequestRepository,
            AppProperties props) {
        this.successHandler = successHandler;
        this.filterHelper = filterHelper;
        this.entryPointHelper = entryPointHelper;
        this.authorizationHelper = authorizationHelper;
        this.customOidcUserService = customOidcUserService;
        this.customOAuth2UserService = customOAuth2UserService;
        this.oauthFailureHandler = oauthFailureHandler;
        this.authorizationRequestRepository = authorizationRequestRepository;
        this.props = props;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        OncePerRequestFilter apiFlagFilter = filterHelper.createApiDetectionFilter();
        RequestMatcher apiMatcher = request -> Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));
        AuthenticationEntryPoint apiEntry = entryPointHelper.createApiEntryPoint();
        AuthenticationEntryPoint webEntry = entryPointHelper.createWebEntryPoint(props.getFrontend().getBaseUrl());
        LogoutSuccessHandler logoutHandler = entryPointHelper.createLogoutSuccessHandler(props);

        http
            .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .cors(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> authorizationHelper.configureAuthorization(auth, props.isDemoReadonly()))
            .exceptionHandling(ex -> ex
                .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                .defaultAuthenticationEntryPointFor(webEntry, request -> true)
            )
            .oauth2Login(oauth -> oauth
                .authorizationEndpoint(ae -> ae.authorizationRequestRepository(authorizationRequestRepository))
                .userInfoEndpoint(ui -> ui.oidcUserService(customOidcUserService).userService(customOAuth2UserService))
                .failureHandler(oauthFailureHandler)
                .successHandler(successHandler)
            )
            .logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessHandler(logoutHandler)
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID", "SESSION")
                .permitAll()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            // CSRF disabled for REST endpoints and logout; session integrity relies on SameSite=None + Secure cookies
            .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**", "/logout", "/actuator/**"));

        return http.build();
    }
}
