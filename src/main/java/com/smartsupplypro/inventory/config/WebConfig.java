package com.smartsupplypro.inventory.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global CORS configuration for allowing frontend-backend communication across domains.
 *
 * <p>This class enables cross-origin requests (CORS) between the frontend SPA (React + Vite)
 * and the Spring Boot backend by defining rules for:
 * <ul>
 *   <li>Allowed origins (localhost and production domain)</li>
 *   <li>Allowed HTTP methods (GET, POST, PUT, DELETE, etc.)</li>
 *   <li>Allowed headers (authorization, content-type, etc.)</li>
 *   <li>Credential support for session cookies and authentication</li>
 * </ul>
 *
 * <p><strong>Important:</strong> Ensure that this configuration stays aligned with the actual
 * frontend deployment origin (e.g., Fly.io, Vercel, etc.) to avoid session or login failures.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Registers global CORS mappings to allow secure cross-origin requests from the frontend.
     *
     * @param registry CORS registry used to define path patterns and rules
     */
    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(
                "http://localhost:5173",              // Local dev environment
                "https://inventoryfrontend.fly.dev"   // Production frontend domain (replace with real when got the domain)
            )
            .allowedMethods("*")        // Allow all standard HTTP methods (GET, POST, PUT, DELETE, etc.)
            .allowedHeaders("*")        // Allow all headers for flexibility
            .allowCredentials(true);    // Allow session cookies (JSESSIONID) to be sent across origins
    }
}

