package com.smartsupplypro.inventory.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

@EnableMethodSecurity(prePostEnabled = true)
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private OAuth2LoginSuccessHandler successHandler;
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/actuator/**").permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("ADMIN")
                .requestMatchers("/api/**").authenticated()
            )
            .oauth2Login(oauth -> oauth
                .loginPage("/oauth2/authorization/google")
                .successHandler(successHandler)
            )
            .logout(logout -> logout.logoutSuccessUrl("/"))
            .csrf(csrf -> csrf.disable()); // Disable CSRF for simplicity, not recommended for production

        return http.build();
    }
}
// This configuration class sets up basic security for the application.