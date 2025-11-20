[⬅️ Back to Security Index](./index.html)

# OAuth2 Authentication

## Overview

Smart Supply Pro implements **OAuth2 authentication** with support for Google and other OpenID Connect (OIDC) providers. The system features automatic user provisioning, secure session management, and stateless authorization request handling.

---

## Authentication Flow

### Step 1: User Initiates Login

User clicks "Login with Google" button on frontend:

```
Frontend: https://inventory.example.com/login
→ Redirects to: https://accounts.google.com/o/oauth2/v2/auth
  ?client_id=<CLIENT_ID>
  &response_type=code
  &scope=openid+profile+email
  &redirect_uri=<backend>/login/oauth2/code/google
```

### Step 2: User Grants Permissions

Google displays consent screen. User approves access to email and profile.

### Step 3: Authorization Code Callback

Google redirects to backend:

```
Backend: GET /login/oauth2/code/google?code=<AUTH_CODE>&state=<STATE>
```

### Step 4: Exchange Code for Token

Backend exchanges authorization code for ID token:

```
POST https://oauth2.googleapis.com/token
  grant_type=authorization_code
  code=<AUTH_CODE>
  client_id=<CLIENT_ID>
  client_secret=<CLIENT_SECRET>
  redirect_uri=<backend>/login/oauth2/code/google

Response: {
  "id_token": "<JWT>",
  "access_token": "<TOKEN>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Step 5: Local User Provisioning

Backend decodes ID token and provisions local user:

```java
// CustomOAuth2UserService.loadUser()
1. Decode JWT and extract claims (email, name, sub)
2. Check if user exists in local database by email
3. If not found, create new AppUser with:
   - email (unique identifier)
   - name (from OAuth2)
   - role (ADMIN if email in APP_ADMIN_EMAILS, else USER)
   - createdAt timestamp
4. If found, perform "role healing" (update role if allow-list changed)
5. Return OAuth2User with ROLE_* authority
```

### Step 6: Session Established

Backend sets secure HTTP-only cookie:

```
Set-Cookie: SESSION=<session-id>; Path=/; SameSite=None; Secure; HttpOnly
```

### Step 7: Redirect to Frontend

Backend redirects to frontend landing page:

```
302 Redirect: https://inventory.example.com/auth
```

---

## Configuration

### Application Properties

**application.yml:**
```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID}
            client-secret: ${SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            scope:
              - openid          # Request ID token (JWT)
              - profile         # Request name and picture
              - email           # Request email address
        provider:
          google:
            authorization-uri: https://accounts.google.com/o/oauth2/v2/auth
            token-uri: https://oauth2.googleapis.com/token
            user-info-uri: https://www.googleapis.com/oauth2/v3/userinfo
```

### Environment Variables

```bash
# From Google Cloud Console (OAuth2 credential)
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_GOOGLE_CLIENT_SECRET=<your-client-secret>

# Admin emails (comma-separated, case-insensitive)
APP_ADMIN_EMAILS=admin@company.com, supervisor@company.de

# Frontend URL for OAuth2 redirects
APP_FRONTEND_BASE_URL=https://inventory.example.com
```

---

## Components

### CustomOAuth2UserService

**Purpose:** Loads OAuth2 user and provisions local user

**Key Features:**
- Reads admin allow-list from `APP_ADMIN_EMAILS` env var
- Creates AppUser on first login
- Performs role healing (updates role if allow-list changed)
- Returns OAuth2User with ROLE_* authorities

**Code Example:**
```java
@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) {
        // 1. Delegate to default service for upstream provider communication
        OAuth2User oauthUser = new DefaultOAuth2UserService().loadUser(request);
        
        // 2. Extract email and name
        String email = oauthUser.getAttribute("email");
        String name = oauthUser.getAttribute("name");
        
        // 3. Determine role from APP_ADMIN_EMAILS
        boolean isAdmin = readAdminAllowlist().contains(email.toLowerCase());
        Role desiredRole = isAdmin ? Role.ADMIN : Role.USER;
        
        // 4. Create or find user
        AppUser user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                AppUser u = new AppUser();
                u.setEmail(email);
                u.setName(name);
                u.setRole(desiredRole);
                u.setCreatedAt(LocalDateTime.now());
                return userRepository.save(u);
            });
        
        // 5. Role healing: update if allow-list changed
        if (user.getRole() != desiredRole) {
            user.setRole(desiredRole);
            userRepository.save(user);
        }
        
        // 6. Return OAuth2User with ROLE_* authority
        SimpleGrantedAuthority roleAuth = 
            new SimpleGrantedAuthority("ROLE_" + user.getRole().name());
        
        Map<String, Object> attrs = new HashMap<>(oauthUser.getAttributes());
        attrs.put("appRole", user.getRole().name());
        
        return new DefaultOAuth2User(
            Collections.singletonList(roleAuth),
            attrs,
            "email"  // name attribute for OAuth2User.getName()
        );
    }
}
```

### CustomOidcUserService

**Purpose:** OIDC-specific user loading for OpenID Connect providers (e.g., Google with ID token)

**Difference from CustomOAuth2UserService:**
- Works with `OidcUserRequest` and `OidcUser` (includes ID token)
- Validates JWT signature using provider's public keys
- More secure for providers supporting OIDC

### OAuth2LoginSuccessHandler

**Purpose:** Post-authentication user provisioning and redirect

**Features:**
- Prevents double-redirect via request attribute check
- Validates return URLs against allow-list
- Creates audit log entry
- Redirects to frontend landing page or return URL

**Code Example:**
```java
@Component
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) {
        // 1. Check if already processed (prevent double-redirect)
        if (request.getAttribute("OAUTH2_SUCCESS_REDIRECT_DONE") != null) {
            return;
        }
        request.setAttribute("OAUTH2_SUCCESS_REDIRECT_DONE", true);
        
        // 2. Extract OAuth2 token and user info
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User principal = token.getPrincipal();
        
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        
        // 3. User already provisioned by CustomOAuth2UserService
        // Create or update AppUser if needed
        AppUser user = userRepository.findByEmail(email)
            .orElseGet(() -> {
                AppUser u = new AppUser();
                u.setEmail(email);
                u.setName(name != null ? name : email);
                return userRepository.save(u);
            });
        
        // 4. Audit log
        log.info("Enterprise OAuth2: User {} authenticated successfully", email);
        
        // 5. Validate return URL and redirect
        String baseUrl = props.getFrontend().getBaseUrl();
        String returnUrl = request.getParameter("return");
        String target = baseUrl + "/auth";
        
        if (returnUrl != null && returnUrl.startsWith(baseUrl)) {
            target = returnUrl;  // Validated redirect
        }
        
        getRedirectStrategy().sendRedirect(request, response, target);
    }
}
```

### CookieOAuth2AuthorizationRequestRepository

**Purpose:** Stateless OAuth2 authorization request persistence using secure cookies

**Why Needed:**
- OAuth2 flow involves multiple requests over time
- State parameter must be preserved across requests
- Cookies provide stateless persistence (suitable for cloud/stateless deployments)

**Security Features:**
- Serializes authorization request to JSON
- Encodes to Base64
- Stores in secure, HTTP-only cookie
- Validates CSRF token
- Origin/domain validation

**Code Example:**
```java
@Component
public class CookieOAuth2AuthorizationRequestRepository 
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {
    
    public static final String AUTH_REQUEST_COOKIE_NAME = "OAUTH2_AUTH_REQUEST";
    public static final int COOKIE_MAX_AGE = 180;  // 3 minutes
    
    @Override
    public void saveAuthorizationRequest(OAuth2AuthorizationRequest authRequest,
                                         HttpServletRequest request,
                                         HttpServletResponse response) {
        String json = writeJson(authRequest);
        String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes());
        
        // Create secure cookie
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, encoded);
        cookie.setPath("/");
        cookie.setSecure(true);           // HTTPS only
        cookie.setHttpOnly(true);         // No JavaScript access
        cookie.setMaxAge(COOKIE_MAX_AGE); // 3 minutes
        cookie.setSameSite(CookieSameSite.NONE);  // Cross-site
        
        response.addCookie(cookie);
    }
    
    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return read(request).orElse(null);
    }
    
    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(HttpServletRequest request,
                                                                  HttpServletResponse response) {
        OAuth2AuthorizationRequest existing = read(request).orElse(null);
        
        // Clear cookie
        Cookie cookie = new Cookie(AUTH_REQUEST_COOKIE_NAME, "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        
        response.addCookie(cookie);
        return existing;
    }
}
```

---

## CORS Configuration for OAuth2

OAuth2 flows require cross-origin requests. Configuration:

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",
        "https://localhost:5173",
        "https://inventory.example.com"
    ));
    config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setAllowedHeaders(Arrays.asList("*"));
    config.setExposedHeaders(Arrays.asList("Set-Cookie"));
    config.setAllowCredentials(true);      // Allow cookies in CORS
    config.setMaxAge(3600L);
    
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
}
```

**Key Points:**
- `allowCredentials=true` allows cookies in cross-origin requests
- `exposedHeaders` includes Set-Cookie for session management
- `allowedOrigins` must match frontend deployment URL
- SameSite=None requires both credentials and Secure flag

---

## Logout Flow

### User-Initiated Logout

```
GET /logout?return=<frontend-url>
→ Backend clears session:
   - Invalidates HttpSession
   - Deletes JSESSIONID and SESSION cookies
   - Logs out user
→ Redirects to frontend logout success page
```

### Session Timeout

Backend enforces session timeout (default: 30 minutes idle).

---

## Error Handling

### Invalid OAuth2 Provider Credentials

```
OAuth2AuthenticationException: "Email not provided by OAuth2 provider"
→ Redirects to: <frontend-base-url>/login?error=oauth
```

### User Provisioning Failure

```
DataIntegrityViolationException on duplicate email:
→ Backend retries with findByEmail
→ Should succeed (user already created)
→ Else: User experiences auth error (rare)
```

---

## Security Considerations

| Threat | Mitigation |
|--------|---|
| **CSRF** | State parameter validated, SameSite cookies |
| **Token Interception** | HTTPS required, Secure cookie flag |
| **XSS** | HttpOnly cookies, no tokens in localStorage |
| **Phishing** | OAuth2 provider handles user authentication |
| **Password Breach** | No passwords stored, delegated to provider |
| **Account Takeover** | Role-based access control limits damage |

---

## Related Documentation

- **[Security Index](./index.html)** - Master security overview
- **[Authorization & RBAC](./authorization-rbac.html)** - Role-based access control
- **[Repository - AppUserRepository](../repository/app-user-repository.html)** - User data access patterns

---

[⬅️ Back to Security Index](./index.html)
