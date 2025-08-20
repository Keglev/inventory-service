package com.smartsupplypro.inventory.controller.security;

import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import static org.springframework.security.config.Customizer.withDefaults;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.smartsupplypro.inventory.controller.AnalyticsController;
import com.smartsupplypro.inventory.service.AnalyticsService;

/**
 * Abstract base for security slice tests of {@link AnalyticsController}.
 *
 * <p><strong>What this provides:</strong>
 * <ul>
 *   <li>A minimal MVC + Security context targeting {@link AnalyticsController} only.</li>
 *   <li>A test-only security chain that allows any authenticated user (USER/ADMIN) on
 *       <code>/api/analytics/**</code> and challenges anonymous requests.</li>
 *   <li>A Mockito-backed {@link AnalyticsService} to satisfy controller wiring.</li>
 * </ul>
 *
 * <p>Concrete endpoint suites extend this base and implement their own request/response assertions.</p>
 */
@WebMvcTest(
        controllers = AnalyticsController.class,
        excludeAutoConfiguration = {
                OAuth2ResourceServerAutoConfiguration.class
        }
)
@AutoConfigureMockMvc(addFilters = true)
@ActiveProfiles("test")
@Import(AbstractAnalyticsControllerSecurityTest.TestSupport.class)
public abstract class AbstractAnalyticsControllerSecurityTest {

    /** Role constant used to simulate a non-admin authenticated user. */
    protected static final String USER = "USER";

    @Autowired
    protected MockMvc mockMvc;

    /**
     * Test-scope support configuration:
     * <ul>
     *   <li>Mocks the business service to decouple security from analytics logic.</li>
     *   <li>Installs a simple {@link SecurityFilterChain} for the analytics policy.</li>
     * </ul>
     */
    @TestConfiguration
    @EnableMethodSecurity
    static class TestSupport {

        /** Provides a Mockito mock for the service layer dependency. */
        @Bean
        @SuppressWarnings("unused")
        AnalyticsService analyticsService() {
            return Mockito.mock(AnalyticsService.class);
        }

        /**
         * Admits any authenticated user to /api/analytics/** and challenges anonymous.
         * Form login + CSRF are disabled for an API-oriented surface; HTTP Basic is enabled for tests.
         */
        @Bean
        @SuppressWarnings("unused")
        SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
            http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/analytics/**").authenticated()
                        .anyRequest().permitAll())
                .httpBasic(withDefaults())
                .formLogin(form -> form.disable());
            return http.build();
        }
    }
}

