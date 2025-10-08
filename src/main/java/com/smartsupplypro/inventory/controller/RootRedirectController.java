package com.smartsupplypro.inventory.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.smartsupplypro.inventory.config.AppProperties;

/**
 * Root path redirection controller that routes "/" requests to frontend application.
 * Uses configurable frontend base URL from application properties.
 * @see controller-patterns.md for redirect pattern documentation
 */
@Controller
public class RootRedirectController {

    /**
     * Application properties with frontend URL/path.
     */
    private final AppProperties props;
    public RootRedirectController(AppProperties props) { this.props = props; }

    /**
     * Redirects root requests to configured frontend application.
     * @return redirect URL to frontend base path
     */
    @GetMapping("/")
    public String root() {
        // Enterprise Comment: Single-page application hosting pattern - redirect root to configured frontend
        // rather than serving static content directly from Spring Boot, enabling flexible deployment models
        return "redirect:" + props.getFrontend().getBaseUrl();
    }
}
