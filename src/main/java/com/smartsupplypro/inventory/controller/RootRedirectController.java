package com.smartsupplypro.inventory.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.smartsupplypro.inventory.config.AppProperties;

/**
 * Redirect requests to the root URL ("/") to the frontend application.
 * <p>
 * This controller handles GET requests to the root URL and redirects them
 * to the frontend base URL specified in the application properties.
 * </p>
 */
@Controller
public class RootRedirectController {

    /**
     * Application properties with frontend URL/path.
     */
    private final AppProperties props;
    public RootRedirectController(AppProperties props) { this.props = props; }

    /**
     * Redirect GET requests to the root URL ("/") to the frontend application.
     *
     * @return a redirect URL to the frontend base URL
     */
    @GetMapping("/")
    public String root() {
        return "redirect:" + props.getFrontend().getBaseUrl();
    }
}
