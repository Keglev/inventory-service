package com.smartsupplypro.inventory.security;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.service.CustomOAuth2UserService;
import com.smartsupplypro.inventory.service.CustomOidcUserService;

@TestConfiguration
class SecurityConfigDemoReadonlyTestBeans {

    @Bean
    OAuth2LoginSuccessHandler successHandler() {
        return Mockito.mock(OAuth2LoginSuccessHandler.class);
    }

    @Bean
    AppUserRepository appUserRepository() {
        return Mockito.mock(AppUserRepository.class);
    }

    @Bean
    CustomOAuth2UserService customOAuth2UserService(AppUserRepository repo) {
        return Mockito.mock(CustomOAuth2UserService.class);
    }

    @Bean
    CustomOidcUserService customOidcUserService(AppUserRepository repo) {
        return Mockito.mock(CustomOidcUserService.class);
    }

    @Bean
    ClientRegistrationRepository clientRegistrationRepository() {
        // Stub Google registration satisfies the OAuth2 filter chain without real credentials.
        ClientRegistration google = ClientRegistration.withRegistrationId("google")
            .clientId("dummy")
            .clientSecret("dummy")
            .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
            .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
            .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
            .tokenUri("https://oauth2.googleapis.com/token")
            .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
            .userNameAttributeName("sub")
            .scope("openid", "profile", "email")
            .clientName("Google")
            .build();
        return new InMemoryClientRegistrationRepository(google);
    }
}
