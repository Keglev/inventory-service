package com.smartsupplypro.inventory.controller;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoController {
    @GetMapping("/")
    public String index() {
        return "Welcome! <a href='/oauth2/authorization/google'>Login with Google</a>";
    }

    @GetMapping("/secured")
    public String secured(@AuthenticationPrincipal OAuth2User principal) {
        return "Logged in as: " + principal.getAttribute("email") + " | Role: " + principal.getAttribute("appRole");
    }

    @GetMapping("/admin-only")
    public String adminOnly(@AuthenticationPrincipal OAuth2User principal) {
        return "[ADMIN] Hello: " + principal.getAttribute("email");
    }
}
