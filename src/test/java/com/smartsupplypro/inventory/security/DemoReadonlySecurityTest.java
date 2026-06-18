package com.smartsupplypro.inventory.security;

import java.io.IOException;

import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.annotation.Resource;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Tests for demo-readonly mode using a minimal in-test security chain:
 * GET requests to inventory and analytics are public; writes remain protected.
 */
@WebMvcTest(controllers = TestApiStubController.class)
@AutoConfigureMockMvc(addFilters = true)
@Import(DemoReadonlySecurityTest.DemoReadonlyTestSecurityConfig.class)
@org.springframework.test.context.ActiveProfiles("test-stub")
class DemoReadonlySecurityTest {

    @Resource
    private MockMvc mockMvc;

    /**
     * Behavior when the request is an unauthenticated read.
     */
    @Nested
    class WhenRequestIsUnauthenticatedRead {

        @Test
        void should_permit_unauthenticated_get_on_inventory_endpoint_in_demo_mode() throws Exception {
            mockMvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isOk())
                   .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"status\":\"ok\"}"));
        }

        @Test
        void should_permit_unauthenticated_get_on_analytics_endpoint_in_demo_mode() throws Exception {
            mockMvc.perform(get("/api/analytics/summary").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isOk())
                   .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"status\":\"ok\"}"));
        }
    }

    /**
     * Behavior when the request is an unauthenticated write.
     */
    @Nested
    class WhenRequestIsUnauthenticatedWrite {

        @Test
        void should_block_unauthenticated_write_request_in_demo_mode() throws Exception {
            mockMvc.perform(patch("/api/inventory/123/price").accept(MediaType.APPLICATION_JSON))
                   .andExpect(status().isUnauthorized())
                   .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                   .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
        }
    }

    /**
     * Minimal security chain for demo-readonly mode:
     * permits GET on inventory/analytics; blocks writes with JSON 401.
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class DemoReadonlyTestSecurityConfig {

        @Bean
        @SuppressWarnings("null") // quiet IDE nullness analysis on doFilterInternal parameters
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {

            // Flag API JSON requests so the entry point can distinguish them from browser requests.
            OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(HttpServletRequest req,
                                                HttpServletResponse res,
                                                FilterChain chain)
                        throws ServletException, IOException {
                    String accept = req.getHeader("Accept");
                    if (req.getRequestURI().startsWith("/api/")
                            && accept != null && accept.contains("application/json")) {
                        req.setAttribute("IS_API_REQUEST", Boolean.TRUE);
                    }
                    chain.doFilter(req, res);
                }
            };

            RequestMatcher apiMatcher = request ->
                Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

            AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Unauthorized\"}");
            };

            http
                .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
                    auth.requestMatchers("/api/analytics/**").permitAll();
                    auth.requestMatchers("/api/**").authenticated();
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(e -> e
                    .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                    .authenticationEntryPoint(apiEntry))
                .csrf(csrf -> csrf.disable());

            return http.build();
        }
    }
}
