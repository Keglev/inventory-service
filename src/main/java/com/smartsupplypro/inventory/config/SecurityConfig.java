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

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Filter to tag JSON-based API requests
        OncePerRequestFilter apiFlagFilter = new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(@NonNull HttpServletRequest req,
                                            @NonNull HttpServletResponse res,
                                            @NonNull FilterChain chain)
                    throws ServletException, IOException {
                String accept = req.getHeader("Accept");
                if (req.getRequestURI().startsWith("/api/")
                        && accept != null && accept.contains("application/json")) {
                    req.setAttribute("IS_API_REQUEST", true);
                }
                chain.doFilter(req, res);
            }
        };

        http.addFilterBefore(apiFlagFilter, AbstractPreAuthenticatedProcessingFilter.class);

        RequestMatcher apiMatcher = request ->
            Boolean.TRUE.equals(request.getAttribute("IS_API_REQUEST"));

        AuthenticationEntryPoint apiEntry = (req, res, ex) -> {
            System.out.println(">>> [API ENTRY POINT] " + req.getRequestURI());
            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            res.setContentType("application/json");
            res.getWriter().write("{\"message\":\"Unauthorized\"}");
        };

        AuthenticationEntryPoint webEntry =
            new LoginUrlAuthenticationEntryPoint("/oauth2/authorization/google");

        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/actuator/**").permitAll()
                // allow Swagger docs publicy
                .requestMatchers(
                    "/swagger-ui/**",
                    "/v3/api-docs/**",
                    "/swagger-resources/**",
                    "/webjars/**",
                    "swagger-ui.html"
                ).permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                .requestMatchers("/api/**").authenticated()
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
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
// This configuration class sets up basic security for the application.