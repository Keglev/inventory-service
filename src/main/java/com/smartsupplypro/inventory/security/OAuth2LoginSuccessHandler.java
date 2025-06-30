package com.smartsupplypro.inventory.security;

import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler{

    @Autowired
    private AppUserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        String email = token.getPrincipal().getAttribute("email");
        String name = token.getPrincipal().getAttribute("name");
        if (email == null || name == null) {
            throw new IllegalStateException("Email or name not provided by OAuth2 provider");
        }

        userRepository.findById(email).orElseGet(() -> {
            AppUser user = new AppUser(email, name);
            user.setRole(Role.USER);
            user.setCreatedAt(LocalDateTime.now());
            System.out.println(">>> Saving new user: " + user.getEmail() + ", role = [" + user.getRole() + "]");
            return userRepository.save(user);
        });

        super.onAuthenticationSuccess(request, response, authentication);
    }

}
