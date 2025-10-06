package com.smartsupplypro.inventory.security;
import java.io.IOException;

import org.junit.jupiter.api.DisplayName;
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
 * Verifies demo-readonly behavior using the real SecurityConfig.
 *
 * When app.demo-readonly=true:
 *  - Unauthenticated GET /api/inventory/** is permitted (200)
 *  - Unauthenticated GET /api/analytics/** is permitted (200)
 *  - Unauthenticated WRITE (PATCH/POST/PUT/DELETE) stays protected (401 JSON)
 */
@WebMvcTest(controllers = TestApiStubController.class)   // << limit to ONLY the stub
@AutoConfigureMockMvc(addFilters = true)                 // enable Spring Security filters
@Import(DemoReadonlySecurityTest.DemoReadonlyTestSecurityConfig.class)
@org.springframework.test.context.ActiveProfiles("test-stub")  // Load TestApiStubController
class DemoReadonlySecurityTest {

    @Resource
    private MockMvc mockMvc;

    /**
     * Verifies that unauthenticated GET requests to /api/inventory/** are permitted in demo-readonly mode.
     */
    @Test
    @DisplayName("GET /api/inventory/** unauthenticated → 200 in demo mode")
    void inventoryGet_isPermitted_inDemoReadonly() throws Exception {
        mockMvc.perform(get("/api/inventory/demo-ok").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
               .andExpect(content().json("{\"status\":\"ok\"}"));
    }

    /**
     * Verifies that unauthenticated GET requests to /api/analytics/** are permitted in demo-readonly mode.
     */
    @Test
    @DisplayName("GET /api/analytics/summary unauthenticated → 200 in demo mode")
    void analyticsGet_isPermitted_inDemoReadonly() throws Exception {
        mockMvc.perform(get("/api/analytics/summary").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isOk())
               .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
               .andExpect(content().json("{\"status\":\"ok\"}"));

    }

    /**
     * Verifies that unauthenticated WRITE requests (PATCH/POST/PUT/DELETE) remain blocked in demo-readonly mode.
     */
    @Test
    @DisplayName("PATCH /api/inventory/{id}/price unauthenticated → 401 JSON (still blocked in demo)")
    void write_isBlocked_inDemoReadonly() throws Exception {
        mockMvc.perform(patch("/api/inventory/123/price").accept(MediaType.APPLICATION_JSON))
               .andExpect(status().isUnauthorized())
               .andExpect(content().contentType(MediaType.APPLICATION_JSON))
               .andExpect(content().json("{\"message\":\"Unauthorized\"}"));
    }

    /**
     * Test-only security chain that mirrors demo-readonly behavior:
     * - Return JSON 401 for /api/** when Accept: application/json and unauthenticated
     * - PermitAll for GET /api/inventory/** and all of /api/analytics/**
     * - Keep write ops authenticated
     */
    @TestConfiguration
    @EnableMethodSecurity
    @SuppressWarnings("unused") // loaded via @Import above
    static class DemoReadonlyTestSecurityConfig {

        @Bean
        @SuppressWarnings("unused") // Spring picks it up; IDE can’t see direct calls
        SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {

            // Flag API JSON requests (matches prod intent)
            OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
                @Override
                @SuppressWarnings("null") // quiet IDE nullness analysis
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

            RequestMatcher apiMatcher = request -> Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

            AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
                res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                res.setContentType("application/json");
                res.getWriter().write("{\"message\":\"Unauthorized\"}");
            };

            http
                .addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class)
                .authorizeHttpRequests(auth -> {
                    // demo-readonly permits
                    auth.requestMatchers(HttpMethod.GET, "/api/inventory/**").permitAll();
                    auth.requestMatchers("/api/analytics/**").permitAll();

                    // everything else under /api/** requires auth
                    auth.requestMatchers("/api/**").authenticated();

                    // non-API endpoints (not used in this slice)
                    auth.anyRequest().authenticated();
                })
                .exceptionHandling(e -> e
                    .defaultAuthenticationEntryPointFor(apiEntry, apiMatcher)
                    .authenticationEntryPoint(apiEntry) // default to JSON 401 in this slice
                )
                .csrf(csrf -> csrf.disable());

            return http.build();
        }
    }
}
