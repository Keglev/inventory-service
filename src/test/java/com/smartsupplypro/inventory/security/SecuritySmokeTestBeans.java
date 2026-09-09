package com.smartsupplypro.inventory.security;

import org.jspecify.annotations.NonNull;
import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.config.SecurityConfig;

/** Mocks for the three {@link SecurityConfig} helper dependencies not covered by {@link SecurityTestBeans}. */
@TestConfiguration
class SecuritySmokeTestBeans {

    @Bean
    com.smartsupplypro.inventory.config.SecurityFilterHelper securityFilterHelper() {
        com.smartsupplypro.inventory.config.SecurityFilterHelper mock =
            Mockito.mock(com.smartsupplypro.inventory.config.SecurityFilterHelper.class);
        Mockito.when(mock.createApiDetectionFilter()).thenReturn(
            new org.springframework.web.filter.OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(
                        jakarta.servlet.http.@NonNull HttpServletRequest req,
                        jakarta.servlet.http.@NonNull HttpServletResponse res,
                        jakarta.servlet.@NonNull FilterChain chain)
                        throws jakarta.servlet.ServletException, java.io.IOException {
                    chain.doFilter(req, res);
                }
            });
        return mock;
    }

    @Bean
    com.smartsupplypro.inventory.config.SecurityEntryPointHelper securityEntryPointHelper() {
        com.smartsupplypro.inventory.config.SecurityEntryPointHelper mock =
            Mockito.mock(com.smartsupplypro.inventory.config.SecurityEntryPointHelper.class);
        Mockito.when(mock.createApiEntryPoint()).thenReturn((req, res, ex) ->
            res.sendError(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"));
        Mockito.when(mock.createWebEntryPoint(Mockito.anyString())).thenReturn((req, res, ex) ->
            res.sendRedirect("/"));
        Mockito.when(mock.createLogoutSuccessHandler(Mockito.any())).thenReturn(
            (req, res, auth) -> res.sendRedirect("/"));
        return mock;
    }

    @Bean
    com.smartsupplypro.inventory.config.SecurityAuthorizationHelper securityAuthorizationHelper() {
        com.smartsupplypro.inventory.config.SecurityAuthorizationHelper mock =
            Mockito.mock(com.smartsupplypro.inventory.config.SecurityAuthorizationHelper.class);
        Mockito.doAnswer(invocation -> {
            org.springframework.security.config.annotation.web.configurers
                    .AuthorizeHttpRequestsConfigurer<?>.AuthorizationManagerRequestMatcherRegistry auth =
                invocation.getArgument(0);
            auth.requestMatchers("/api/admin/**").hasRole("ADMIN");
            auth.anyRequest().authenticated();
            return null;
        }).when(mock).configureAuthorization(Mockito.any(), Mockito.anyBoolean());
        return mock;
    }

    // AppProperties is provided by @EnableConfigurationProperties on SecurityConfig — do not redeclare here
}
