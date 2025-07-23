package com.smartsupplypro.inventory.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;

import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;

/**
 * Custom implementation of {@link OAuth2UserService} that integrates OAuth2 login
 * with internal user management and role assignment logic.
 * <p>
 * This class is responsible for loading user details from an OAuth2 provider (e.g. Google),
 * and mapping them to the system's internal {@link AppUser} entity, with role management,
 * user persistence, and constraint enforcement (e.g. user limits).
 * </p>
 *
 * <p>
 * If the user logs in for the first time, a new record is created unless the system
 * already has the maximum number of allowed users. The first admin user is determined
 * by email.
 * </p>
 *
 * <h3>Responsibilities:</h3>
 * <ul>
 *   <li>Retrieve authenticated OAuth2 user details</li>
 *   <li>Create or reuse internal {@link AppUser} entity</li>
 *   <li>Assign appropriate {@link Role} (ADMIN or USER)</li>
 *   <li>Enforce a maximum of 10 registered users</li>
 *   <li>Inject system roles into the Spring Security context</li>
 * </ul>
 *
 * @author SmartSupply
 */
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    @Autowired
    private AppUserRepository userRepository;

    /**
     * Loads and processes the authenticated OAuth2 user.
     *
     * @param userRequest the request containing OAuth2 provider and token info
     * @return a {@link DefaultOAuth2User} enriched with application-specific role information
     * @throws OAuth2AuthenticationException if the user cannot be loaded or violates constraints
     */
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(userRequest);

        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found in OAuth2 provider");
        }

         Optional<AppUser> optionalUser = userRepository.findByEmail(email);

        AppUser user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
        } else {
            if (userRepository.count() >= 10) {
                throw new OAuth2AuthenticationException("User limit reached");
            }

            AppUser newUser = new AppUser(email, name);
            newUser.setRole(email.equals("ckbuzin1@gmail.com") ? Role.ADMIN : Role.USER);
            newUser.setCreatedAt(LocalDateTime.now());

            try {
                user = userRepository.save(newUser);
            } catch (DataIntegrityViolationException ex) {
                // Duplicate detected — fallback to fetch existing user
                System.err.println(">>> Detected duplicate user insert (already exists): " + email);
                user = userRepository.findByEmail(email).orElseThrow(() ->
                        new OAuth2AuthenticationException("User already exists but cannot be loaded"));
            }
        }

        Map<String, Object> attributes = new HashMap<>(oauthUser.getAttributes());
        attributes.put("appRole", user.getRole().name());

        return new DefaultOAuth2User(
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                attributes,
                "name"
        );
    }
}
// This code handles the OAuth2 login success scenario, registering new users if they do not exist in the database.
