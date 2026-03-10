package com.smartsupplypro.inventory.security.oauth2login;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.smartsupplypro.inventory.config.AppProperties;
import com.smartsupplypro.inventory.model.AppUser;
import com.smartsupplypro.inventory.model.Role;
import com.smartsupplypro.inventory.repository.AppUserRepository;
import com.smartsupplypro.inventory.security.OAuth2LoginSuccessHandler;

/**
 * Unit tests for {@link OAuth2LoginSuccessHandler} focused on user provisioning and fail-fast validation.
 *
 * <h2>Scope</h2>
 * <ul>
 *   <li>First-login onboarding persists a new {@link AppUser} with {@link Role#USER}.</li>
 *   <li>Existing-user flow does not duplicate records.</li>
 *   <li>Duplicate-insert races are handled via {@link DataIntegrityViolationException} fallback.</li>
 *   <li>Mandatory attribute validation (email, name) fails fast.</li>
 *   <li>Duplicate-success guard prevents a second redirect/provisioning attempt.</li>
 * </ul>
 *
 * <h2>Design</h2>
 * <ul>
 *   <li>No Spring context: pure Mockito with {@link MockitoExtension}.</li>
 *   <li>Frontend properties are stubbed only for tests that reach redirect logic to avoid
 *       Mockito {@code UnnecessaryStubbingException} on early-fail paths.</li>
 * </ul>
 */
@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerProvisioningTest {

    @InjectMocks
    OAuth2LoginSuccessHandler handler;

    @Mock
    AppUserRepository userRepository;

    @Mock
    AppProperties props;

    @Mock
    AppProperties.Frontend frontend;

    private void stubFrontend(String baseUrl, String landingPath) {
        when(props.getFrontend()).thenReturn(frontend);
        when(frontend.getBaseUrl()).thenReturn(baseUrl);
        when(frontend.getLandingPath()).thenReturn(landingPath);
    }

    @Test
    @DisplayName("Creates new user with ROLE_USER and redirects")
    void createsNewUser() throws Exception {
        String email = "new@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res,
            OAuth2LoginSuccessHandlerTestSupport.token(email, "New User"));

        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        verify(userRepository).save(captor.capture());
        AppUser saved = captor.getValue();

        assertThat(saved.getEmail()).isEqualTo(email);
        assertThat(saved.getRole()).isEqualTo(Role.USER);
        assertThat(saved.getCreatedAt()).isNotNull();
        assertThat(saved.getCreatedAt()).isBeforeOrEqualTo(LocalDateTime.now());
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    @Test
    @DisplayName("Existing user: no duplicate save, still redirects")
    void existingUserNoDuplicate() throws Exception {
        String email = "exists@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.of(new AppUser(email, "Exists")));
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res,
            OAuth2LoginSuccessHandlerTestSupport.token(email, "Exists"));

        verify(userRepository, never()).save(any());
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    @Test
    @DisplayName("Duplicate race: DataIntegrityViolation handled via findByEmail fallback")
    void duplicateRaceHandled() throws Exception {
        String email = "race@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(new AppUser(email, "Race")));
        stubFrontend("https://localhost:8081", "/api/me");

        MockHttpServletResponse res = new OAuth2LoginSuccessHandlerTestSupport.LenientRedirectResponse();
        handler.onAuthenticationSuccess(new MockHttpServletRequest(), res,
            OAuth2LoginSuccessHandlerTestSupport.token(email, "Race"));

        verify(userRepository).findByEmail(email);
        assertThat(res.getRedirectedUrl()).isEqualTo("https://localhost:8081/api/me");
    }

    @Test
    @DisplayName("Duplicate race: when fallback lookup fails, handler throws")
    void duplicateRaceFallbackMissingUser_throws() {
        String email = "race-miss@example.com";
        when(userRepository.findById(email)).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenThrow(new DataIntegrityViolationException("dup"));
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(),
                OAuth2LoginSuccessHandlerTestSupport.token(email, "Race")));

        assertThat(ex.getMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Missing email -> IllegalStateException")
    void missingEmailThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            java.util.Collections.singletonList(() -> "ROLE_USER"),
            Map.of("name", "No Email"),
            "name"
        );
        OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));

        assertThat(ex.getMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Missing name -> IllegalStateException")
    void missingNameThrows() {
        OAuth2User principal = new DefaultOAuth2User(
            java.util.Collections.singletonList(() -> "ROLE_USER"),
            Map.of("email", "no-name@example.com"),
            "email"
        );
        OAuth2AuthenticationToken t = new OAuth2AuthenticationToken(principal, principal.getAuthorities(), "google");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
            handler.onAuthenticationSuccess(new MockHttpServletRequest(), new MockHttpServletResponse(), t));

        assertThat(ex.getMessage()).isNotBlank();
    }

    @Test
    @DisplayName("Duplicate success handling: second call skips redirect and provisioning")
    void duplicateRedirectIsSkipped() throws Exception {
        MockHttpServletRequest req = new MockHttpServletRequest();
        req.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", Boolean.TRUE);

        MockHttpServletResponse res = new MockHttpServletResponse();
        handler.onAuthenticationSuccess(req, res,
            OAuth2LoginSuccessHandlerTestSupport.token("skip@example.com", "Skip"));

        verify(userRepository, never()).findById(any());
        verify(userRepository, never()).save(any());
        assertThat(res.getRedirectedUrl()).isNull();
    }
}
