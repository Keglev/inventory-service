package com.smartsupplypro.inventory.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import com.smartsupplypro.inventory.config.AppProperties;

/**
 * Redirects root ({@code /}) requests to the configured frontend application.
 *
 * <p>No authentication required. The target URL is read from
 * {@link AppProperties} to support deployment-time configuration.</p>
 *
 * @see AppProperties
 */
@Controller
public class RootRedirectController {

    private final AppProperties props;

    public RootRedirectController(AppProperties props) {
        this.props = props;
    }

    /**
     * Sends a browser that opens the root of this host to the frontend.
     *
     * @return a redirect to the configured frontend base URL
     */
    @GetMapping("/")
    public String root() {
        return "redirect:" + props.getFrontend().getBaseUrl();
    }
}
