# OAuth2 Services Architecture

## Overview

The **OAuth2 Services** module provides comprehensive authentication and authorization capabilities for the Smart Supply Pro inventory system. It implements OAuth 2.0 and OpenID Connect standards to secure API endpoints, manage user sessions, and enforce role-based access control (RBAC). The architecture supports enterprise-grade security with JWT tokens, refresh token rotation, and fine-grained permission management.

## Core Components

### 1. OAuth2 Configuration Service
- **JWT Token Management**: Generation, validation, and lifecycle management
- **Refresh Token Strategy**: Secure token renewal with rotation
- **CORS Configuration**: Cross-origin resource sharing for frontend integration
- **Security Filter Chain**: Authentication and authorization pipeline

### 2. Authentication Services
- **Login/Logout Flows**: Secure session management
- **Token Validation**: JWT signature verification and claims validation
- **User Context**: Security context extraction and user information
- **Session Management**: Stateless authentication with token storage

### 3. Authorization Framework
- **Role-Based Access Control**: Hierarchical permission system
- **Method-Level Security**: Annotation-driven authorization
- **Resource Protection**: Endpoint-specific access control
- **Permission Evaluation**: Dynamic authorization decisions

### 4. Security Integration
- **Spring Security Integration**: Comprehensive security framework
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API abuse prevention
- **Audit Logging**: Security event tracking

## OAuth2 Flow Architecture

### Authorization Code Flow (Primary)
```
1. Client → Authorization Server: /oauth/authorize
2. User → Authorization Server: Login credentials
3. Authorization Server → Client: Authorization code
4. Client → Authorization Server: /oauth/token (code)
5. Authorization Server → Client: Access token + Refresh token
6. Client → Resource Server: API requests with Bearer token
7. Resource Server → Authorization Server: Token validation
8. Resource Server → Client: Protected resource data
```

### Token Refresh Flow
```
1. Client → Authorization Server: /oauth/token (refresh_token)
2. Authorization Server: Validate refresh token
3. Authorization Server → Client: New access token + New refresh token
4. Authorization Server: Invalidate old refresh token
```

### Token Validation Flow
```
1. Client → Resource Server: API request with Bearer token
2. Resource Server → JWT Validator: Parse and validate token
3. JWT Validator → Resource Server: Token claims and validity
4. Resource Server → Client: Authorized response or 401/403
```

## Key Services Deep Dive

### 1. OAuth2AuthenticationController

#### Login Endpoint
**Purpose**: Authenticate users and issue JWT tokens with refresh token support.

**Endpoint**: `POST /auth/login`

**Implementation Flow**:
```java
@PostMapping("/login")
public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest request) {
    try {
        // 1. Validate credentials
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.getUsername(), 
                request.getPassword()
            )
        );
        
        // 2. Generate JWT access token
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String accessToken = jwtTokenProvider.generateToken(userPrincipal);
        
        // 3. Generate refresh token
        String refreshToken = jwtTokenProvider.generateRefreshToken(userPrincipal);
        
        // 4. Store refresh token (for rotation)
        refreshTokenService.storeRefreshToken(userPrincipal.getId(), refreshToken);
        
        // 5. Build response
        AuthenticationResponse response = AuthenticationResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getAccessTokenValidityInSeconds())
            .user(UserMapper.toDTO(userPrincipal))
            .build();
        
        // 6. Log successful authentication
        auditService.logAuthenticationSuccess(userPrincipal.getUsername());
        
        return ResponseEntity.ok(response);
        
    } catch (BadCredentialsException e) {
        auditService.logAuthenticationFailure(request.getUsername());
        throw new InvalidCredentialsException("Invalid username or password");
    }
}
```

**Security Features**:
- **Credential Validation**: Spring Security authentication manager
- **Token Generation**: Cryptographically signed JWT tokens
- **Refresh Token Storage**: Secure server-side storage with rotation
- **Audit Logging**: Authentication attempts tracked for security monitoring
- **Error Handling**: Generic error messages to prevent user enumeration

#### Token Refresh Endpoint
**Purpose**: Renew access tokens using valid refresh tokens with rotation.

**Endpoint**: `POST /auth/refresh`

**Implementation Flow**:
```java
@PostMapping("/refresh")
public ResponseEntity<AuthenticationResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
    try {
        String refreshToken = request.getRefreshToken();
        
        // 1. Validate refresh token format and signature
        if (!jwtTokenProvider.validateRefreshToken(refreshToken)) {
            throw new InvalidTokenException("Invalid refresh token");
        }
        
        // 2. Extract user from refresh token
        String userId = jwtTokenProvider.getUserIdFromRefreshToken(refreshToken);
        
        // 3. Verify refresh token is stored (not revoked)
        if (!refreshTokenService.isValidRefreshToken(userId, refreshToken)) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }
        
        // 4. Load user details
        UserPrincipal userPrincipal = customUserDetailsService.loadUserById(userId);
        
        // 5. Generate new access token
        String newAccessToken = jwtTokenProvider.generateToken(userPrincipal);
        
        // 6. Generate new refresh token (rotation)
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userPrincipal);
        
        // 7. Replace old refresh token with new one
        refreshTokenService.rotateRefreshToken(userId, refreshToken, newRefreshToken);
        
        // 8. Build response
        AuthenticationResponse response = AuthenticationResponse.builder()
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .tokenType("Bearer")
            .expiresIn(jwtTokenProvider.getAccessTokenValidityInSeconds())
            .build();
        
        // 9. Log token refresh
        auditService.logTokenRefresh(userPrincipal.getUsername());
        
        return ResponseEntity.ok(response);
        
    } catch (Exception e) {
        throw new InvalidTokenException("Unable to refresh token");
    }
}
```

**Refresh Token Security**:
- **Token Rotation**: New refresh token issued, old one invalidated
- **Storage Validation**: Server-side verification prevents replay attacks
- **Expiration Handling**: Refresh tokens have longer but limited lifetime
- **Revocation Support**: Ability to invalidate all user sessions

#### Logout Endpoint
**Purpose**: Invalidate user session and revoke all tokens.

**Endpoint**: `POST /auth/logout`

**Implementation Flow**:
```java
@PostMapping("/logout")
public ResponseEntity<Void> logout(HttpServletRequest request) {
    try {
        // 1. Extract access token from Authorization header
        String accessToken = extractTokenFromRequest(request);
        
        if (accessToken != null) {
            // 2. Get user ID from token
            String userId = jwtTokenProvider.getUserIdFromToken(accessToken);
            
            // 3. Revoke all refresh tokens for user
            refreshTokenService.revokeAllUserTokens(userId);
            
            // 4. Add access token to blacklist (until expiration)
            tokenBlacklistService.blacklistToken(accessToken);
            
            // 5. Log logout event
            String username = jwtTokenProvider.getUsernameFromToken(accessToken);
            auditService.logLogout(username);
        }
        
        return ResponseEntity.ok().build();
        
    } catch (Exception e) {
        log.warn("Error during logout: {}", e.getMessage());
        // Still return success to prevent information leakage
        return ResponseEntity.ok().build();
    }
}
```

**Logout Security**:
- **Token Revocation**: All refresh tokens invalidated
- **Blacklist Management**: Access tokens blacklisted until expiration
- **Graceful Handling**: Logout succeeds even with invalid tokens
- **Audit Trail**: Logout events tracked for security monitoring

### 2. JwtTokenProvider

#### Token Generation
**Purpose**: Create cryptographically signed JWT tokens with appropriate claims.

**Access Token Generation**:
```java
public String generateToken(UserPrincipal userPrincipal) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + accessTokenValidityInMilliseconds);
    
    return Jwts.builder()
        .setSubject(userPrincipal.getId())
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .claim("username", userPrincipal.getUsername())
        .claim("email", userPrincipal.getEmail())
        .claim("roles", userPrincipal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(toList()))
        .claim("permissions", extractPermissions(userPrincipal))
        .signWith(SignatureAlgorithm.HS512, jwtSecret)
        .compact();
}
```

**Refresh Token Generation**:
```java
public String generateRefreshToken(UserPrincipal userPrincipal) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + refreshTokenValidityInMilliseconds);
    
    return Jwts.builder()
        .setSubject(userPrincipal.getId())
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .claim("type", "refresh")
        .claim("jti", UUID.randomUUID().toString())  // Unique token ID
        .signWith(SignatureAlgorithm.HS512, jwtSecret)
        .compact();
}
```

**Token Claims Structure**:
```json
{
  "sub": "user-id-123",           // Subject (user ID)
  "iat": 1640995200,              // Issued at timestamp
  "exp": 1640998800,              // Expiration timestamp
  "username": "john.doe",         // Username for display
  "email": "john@example.com",    // User email
  "roles": ["ADMIN", "USER"],     // Role-based permissions
  "permissions": [                // Fine-grained permissions
    "inventory:read",
    "inventory:write",
    "analytics:read"
  ],
  "jti": "token-id-456"          // JWT ID for tracking
}
```

#### Token Validation
**Purpose**: Verify token integrity and extract user claims securely.

**Implementation**:
```java
public boolean validateToken(String token) {
    try {
        // 1. Check if token is blacklisted
        if (tokenBlacklistService.isBlacklisted(token)) {
            return false;
        }
        
        // 2. Parse and validate signature
        Claims claims = Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody();
        
        // 3. Check expiration
        Date expiration = claims.getExpiration();
        if (expiration.before(new Date())) {
            return false;
        }
        
        // 4. Validate required claims
        String userId = claims.getSubject();
        if (userId == null || userId.trim().isEmpty()) {
            return false;
        }
        
        return true;
        
    } catch (SignatureException ex) {
        log.error("Invalid JWT signature");
    } catch (MalformedJwtException ex) {
        log.error("Invalid JWT token");
    } catch (ExpiredJwtException ex) {
        log.error("Expired JWT token");
    } catch (UnsupportedJwtException ex) {
        log.error("Unsupported JWT token");
    } catch (IllegalArgumentException ex) {
        log.error("JWT claims string is empty");
    }
    
    return false;
}
```

**Validation Layers**:
1. **Blacklist Check**: Ensures token hasn't been revoked
2. **Signature Verification**: Cryptographic integrity validation
3. **Expiration Check**: Time-based validity verification
4. **Claims Validation**: Required fields present and valid
5. **Exception Handling**: Comprehensive error scenarios

### 3. CustomUserDetailsService

#### User Loading
**Purpose**: Load user details and authorities for authentication and authorization.

**Implementation**:
```java
@Transactional(readOnly = true)
public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    User user = userRepository.findByUsername(username)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    
    return UserPrincipal.create(user);
}

@Transactional(readOnly = true)
public UserDetails loadUserById(String id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
    
    return UserPrincipal.create(user);
}
```

**UserPrincipal Implementation**:
```java
public class UserPrincipal implements UserDetails {
    private String id;
    private String username;
    private String email;
    private String password;
    private Collection<? extends GrantedAuthority> authorities;
    
    public static UserPrincipal create(User user) {
        List<GrantedAuthority> authorities = user.getRoles().stream()
            .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
            .collect(toList());
        
        // Add permissions from roles
        user.getRoles().forEach(role -> {
            role.getPermissions().forEach(permission -> {
                authorities.add(new SimpleGrantedAuthority(permission.getName()));
            });
        });
        
        return new UserPrincipal(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getPassword(),
            authorities
        );
    }
    
    @Override
    public boolean isAccountNonExpired() { return true; }
    
    @Override
    public boolean isAccountNonLocked() { return true; }
    
    @Override
    public boolean isCredentialsNonExpired() { return true; }
    
    @Override
    public boolean isEnabled() { return true; }
}
```

**Authority Mapping**:
- **Roles**: High-level user classifications (ADMIN, MANAGER, USER)
- **Permissions**: Fine-grained access rights (inventory:read, analytics:write)
- **Spring Security Integration**: GrantedAuthority interface implementation
- **Hierarchical Structure**: Roles contain multiple permissions

### 4. JwtAuthenticationFilter

#### Request Processing
**Purpose**: Intercept requests and establish security context from JWT tokens.

**Implementation**:
```java
@Override
protected void doFilterInternal(HttpServletRequest request, 
                               HttpServletResponse response, 
                               FilterChain filterChain) throws ServletException, IOException {
    try {
        // 1. Extract JWT token from request
        String jwt = getJwtFromRequest(request);
        
        if (StringUtils.hasText(jwt) && jwtTokenProvider.validateToken(jwt)) {
            // 2. Get user ID from token
            String userId = jwtTokenProvider.getUserIdFromToken(jwt);
            
            // 3. Load user details
            UserDetails userDetails = customUserDetailsService.loadUserById(userId);
            
            // 4. Create authentication object
            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(
                    userDetails, 
                    null, 
                    userDetails.getAuthorities()
                );
            
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            
            // 5. Set security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
    } catch (Exception ex) {
        log.error("Could not set user authentication in security context", ex);
    }
    
    filterChain.doFilter(request, response);
}

private String getJwtFromRequest(HttpServletRequest request) {
    String bearerToken = request.getHeader("Authorization");
    if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
        return bearerToken.substring(7);
    }
    return null;
}
```

**Filter Chain Position**:
- **Before**: Spring Security's UsernamePasswordAuthenticationFilter
- **After**: CORS filter and basic security filters
- **Purpose**: Establish authenticated user context for subsequent filters
- **Exception Handling**: Graceful failure allows anonymous access where permitted

## Role-Based Access Control (RBAC)

### Role Hierarchy
```java
public enum Role {
    SUPER_ADMIN("SUPER_ADMIN", 1000),
    ADMIN("ADMIN", 800),
    MANAGER("MANAGER", 600),
    SUPERVISOR("SUPERVISOR", 400),
    EMPLOYEE("EMPLOYEE", 200),
    VIEWER("VIEWER", 100);
    
    private final String name;
    private final int hierarchyLevel;
    
    public boolean hasAuthorityOver(Role other) {
        return this.hierarchyLevel > other.hierarchyLevel;
    }
}
```

### Permission System
```java
public enum Permission {
    // Inventory permissions
    INVENTORY_READ("inventory:read"),
    INVENTORY_WRITE("inventory:write"),
    INVENTORY_DELETE("inventory:delete"),
    INVENTORY_ADMIN("inventory:admin"),
    
    // Analytics permissions
    ANALYTICS_READ("analytics:read"),
    ANALYTICS_WRITE("analytics:write"),
    ANALYTICS_EXPORT("analytics:export"),
    
    // User management permissions
    USER_READ("user:read"),
    USER_WRITE("user:write"),
    USER_DELETE("user:delete"),
    USER_ADMIN("user:admin"),
    
    // Supplier permissions
    SUPPLIER_READ("supplier:read"),
    SUPPLIER_WRITE("supplier:write"),
    SUPPLIER_DELETE("supplier:delete"),
    
    // System permissions
    SYSTEM_CONFIG("system:config"),
    SYSTEM_AUDIT("system:audit"),
    SYSTEM_ADMIN("system:admin");
}
```

### Method-Level Security
```java
@RestController
@RequestMapping("/api/inventory")
@PreAuthorize("hasRole('USER')")
public class InventoryController {
    
    @GetMapping
    @PreAuthorize("hasPermission(null, 'inventory:read')")
    public ResponseEntity<List<InventoryItemDTO>> getAllItems() {
        // Implementation
    }
    
    @PostMapping
    @PreAuthorize("hasPermission(null, 'inventory:write')")
    public ResponseEntity<InventoryItemDTO> createItem(@RequestBody InventoryItemDTO dto) {
        // Implementation
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'InventoryItem', 'inventory:delete')")
    public ResponseEntity<Void> deleteItem(@PathVariable String id) {
        // Implementation
    }
    
    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN') and hasPermission(null, 'analytics:read')")
    public ResponseEntity<AnalyticsDTO> getAnalytics() {
        // Implementation
    }
}
```

### Custom Permission Evaluator
```java
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {
    
    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || permission == null) {
            return false;
        }
        
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        String permissionString = permission.toString();
        
        // Check if user has the specific permission
        return userPrincipal.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .anyMatch(auth -> auth.equals(permissionString));
    }
    
    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, 
                                String targetType, Object permission) {
        // Resource-specific permission checking
        if ("InventoryItem".equals(targetType)) {
            return hasInventoryItemPermission(authentication, targetId, permission);
        }
        
        return hasPermission(authentication, null, permission);
    }
    
    private boolean hasInventoryItemPermission(Authentication authentication, 
                                             Serializable itemId, Object permission) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        // Check if user has general permission
        if (hasPermission(authentication, null, permission)) {
            return true;
        }
        
        // Check if user is owner/creator of the item
        if ("inventory:delete".equals(permission.toString())) {
            InventoryItem item = inventoryService.findById(itemId.toString());
            return item.getCreatedBy().equals(userPrincipal.getUsername());
        }
        
        return false;
    }
}
```

## Security Configuration

### Spring Security Configuration
```java
@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Autowired
    private CustomUserDetailsService customUserDetailsService;
    
    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);  // Strong encryption
    }
    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) 
            throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors().and().csrf().disable()
            .exceptionHandling()
                .authenticationEntryPoint(unauthorizedHandler)
                .and()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
            .authorizeHttpRequests(authz -> authz
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/health/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                
                // Admin-only endpoints
                .requestMatchers("/admin/**").hasRole("ADMIN")
                
                // Protected endpoints
                .anyRequest().authenticated()
            );
        
        // Add JWT filter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("http://localhost:*", "https://*.smartsupplypro.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

### JWT Configuration Properties
```yaml
jwt:
  secret: ${JWT_SECRET:mySecretKey}
  access-token-validity-in-seconds: 3600    # 1 hour
  refresh-token-validity-in-seconds: 2592000 # 30 days

security:
  cors:
    allowed-origins: 
      - http://localhost:3000
      - https://app.smartsupplypro.com
    allowed-methods: GET,POST,PUT,DELETE,OPTIONS
    max-age: 3600
    
  rate-limiting:
    login-attempts: 5
    window-minutes: 15
    lockout-minutes: 30
```

## Token Management

### Refresh Token Storage
```java
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String userId;
    
    @Column(nullable = false, unique = true)
    private String token;
    
    @Column(nullable = false)
    private LocalDateTime expiryDate;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column
    private LocalDateTime revokedAt;
    
    private boolean revoked = false;
}

@Service
public class RefreshTokenService {
    
    public void storeRefreshToken(String userId, String token) {
        RefreshToken refreshToken = RefreshToken.builder()
            .id(UUID.randomUUID().toString())
            .userId(userId)
            .token(token)
            .expiryDate(LocalDateTime.now().plus(refreshTokenValidityDuration))
            .createdAt(LocalDateTime.now())
            .revoked(false)
            .build();
        
        repository.save(refreshToken);
    }
    
    public void rotateRefreshToken(String userId, String oldToken, String newToken) {
        // Revoke old token
        repository.findByToken(oldToken)
            .ifPresent(token -> {
                token.setRevoked(true);
                token.setRevokedAt(LocalDateTime.now());
                repository.save(token);
            });
        
        // Store new token
        storeRefreshToken(userId, newToken);
    }
    
    public boolean isValidRefreshToken(String userId, String token) {
        return repository.findByUserIdAndTokenAndRevokedFalse(userId, token)
            .filter(rt -> rt.getExpiryDate().isAfter(LocalDateTime.now()))
            .isPresent();
    }
    
    public void revokeAllUserTokens(String userId) {
        List<RefreshToken> userTokens = repository.findByUserIdAndRevokedFalse(userId);
        userTokens.forEach(token -> {
            token.setRevoked(true);
            token.setRevokedAt(LocalDateTime.now());
        });
        repository.saveAll(userTokens);
    }
}
```

### Token Blacklisting
```java
@Component
public class TokenBlacklistService {
    
    private final RedisTemplate<String, String> redisTemplate;
    private static final String BLACKLIST_PREFIX = "blacklisted_token:";
    
    public void blacklistToken(String token) {
        try {
            // Extract expiration time from token
            Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
            
            Date expiration = claims.getExpiration();
            long timeToLive = expiration.getTime() - System.currentTimeMillis();
            
            if (timeToLive > 0) {
                // Store in Redis with TTL until natural expiration
                redisTemplate.opsForValue().set(
                    BLACKLIST_PREFIX + token, 
                    "revoked", 
                    Duration.ofMilliseconds(timeToLive)
                );
            }
        } catch (Exception e) {
            log.error("Error blacklisting token: {}", e.getMessage());
        }
    }
    
    public boolean isBlacklisted(String token) {
        return redisTemplate.hasKey(BLACKLIST_PREFIX + token);
    }
    
    @Scheduled(cron = "0 0 2 * * ?")  // Daily cleanup at 2 AM
    public void cleanupExpiredBlacklistedTokens() {
        // Redis TTL handles this automatically, but manual cleanup for monitoring
        Set<String> keys = redisTemplate.keys(BLACKLIST_PREFIX + "*");
        if (keys != null) {
            log.info("Current blacklisted tokens: {}", keys.size());
        }
    }
}
```

## Security Monitoring and Auditing

### Authentication Audit Service
```java
@Service
public class AuthenticationAuditService {
    
    private final AuditEventRepository auditRepository;
    
    public void logAuthenticationSuccess(String username) {
        AuditEvent event = AuditEvent.builder()
            .id(UUID.randomUUID().toString())
            .eventType(AuditEventType.AUTHENTICATION_SUCCESS)
            .username(username)
            .timestamp(LocalDateTime.now())
            .ipAddress(getCurrentUserIpAddress())
            .userAgent(getCurrentUserAgent())
            .details(Map.of("action", "login"))
            .build();
        
        auditRepository.save(event);
    }
    
    public void logAuthenticationFailure(String username) {
        AuditEvent event = AuditEvent.builder()
            .id(UUID.randomUUID().toString())
            .eventType(AuditEventType.AUTHENTICATION_FAILURE)
            .username(username)
            .timestamp(LocalDateTime.now())
            .ipAddress(getCurrentUserIpAddress())
            .userAgent(getCurrentUserAgent())
            .details(Map.of("action", "failed_login"))
            .build();
        
        auditRepository.save(event);
        
        // Check for brute force attacks
        checkForBruteForceAttack(username);
    }
    
    public void logTokenRefresh(String username) {
        AuditEvent event = AuditEvent.builder()
            .id(UUID.randomUUID().toString())
            .eventType(AuditEventType.TOKEN_REFRESH)
            .username(username)
            .timestamp(LocalDateTime.now())
            .ipAddress(getCurrentUserIpAddress())
            .details(Map.of("action", "token_refresh"))
            .build();
        
        auditRepository.save(event);
    }
    
    public void logLogout(String username) {
        AuditEvent event = AuditEvent.builder()
            .id(UUID.randomUUID().toString())
            .eventType(AuditEventType.LOGOUT)
            .username(username)
            .timestamp(LocalDateTime.now())
            .ipAddress(getCurrentUserIpAddress())
            .details(Map.of("action", "logout"))
            .build();
        
        auditRepository.save(event);
    }
    
    private void checkForBruteForceAttack(String username) {
        LocalDateTime windowStart = LocalDateTime.now().minusMinutes(15);
        
        long failedAttempts = auditRepository.countFailedAttemptsInWindow(
            username, windowStart, LocalDateTime.now()
        );
        
        if (failedAttempts >= 5) {
            securityAlertService.sendBruteForceAlert(username, failedAttempts);
        }
    }
}
```

### Rate Limiting
```java
@Component
public class AuthenticationRateLimiter {
    
    private final RedisTemplate<String, String> redisTemplate;
    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW_DURATION = Duration.ofMinutes(15);
    
    public boolean isAllowed(String identifier) {
        String key = RATE_LIMIT_PREFIX + identifier;
        
        String currentCount = redisTemplate.opsForValue().get(key);
        
        if (currentCount == null) {
            // First attempt in window
            redisTemplate.opsForValue().set(key, "1", WINDOW_DURATION);
            return true;
        }
        
        int attempts = Integer.parseInt(currentCount);
        
        if (attempts >= MAX_ATTEMPTS) {
            return false;  // Rate limit exceeded
        }
        
        // Increment counter
        redisTemplate.opsForValue().increment(key);
        return true;
    }
    
    public void reset(String identifier) {
        redisTemplate.delete(RATE_LIMIT_PREFIX + identifier);
    }
    
    public long getRemainingAttempts(String identifier) {
        String key = RATE_LIMIT_PREFIX + identifier;
        String currentCount = redisTemplate.opsForValue().get(key);
        
        if (currentCount == null) {
            return MAX_ATTEMPTS;
        }
        
        return Math.max(0, MAX_ATTEMPTS - Integer.parseInt(currentCount));
    }
}
```

## Error Handling

### Custom Security Exceptions
```java
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}

public class InvalidTokenException extends RuntimeException {
    public InvalidTokenException(String message) {
        super(message);
    }
}

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}

@ControllerAdvice
public class SecurityExceptionHandler {
    
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.UNAUTHORIZED.value())
            .error("Unauthorized")
            .message("Invalid credentials")
            .path("/auth/login")
            .build();
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(InvalidTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidToken(InvalidTokenException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.UNAUTHORIZED.value())
            .error("Unauthorized")
            .message("Invalid or expired token")
            .build();
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }
    
    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleRateLimitExceeded(RateLimitExceededException ex) {
        ErrorResponse error = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.TOO_MANY_REQUESTS.value())
            .error("Too Many Requests")
            .message("Rate limit exceeded. Please try again later.")
            .build();
        
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }
}
```

### Authentication Entry Point
```java
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                        AuthenticationException authException) throws IOException {
        
        response.setContentType("application/json;charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
            .timestamp(LocalDateTime.now())
            .status(HttpStatus.UNAUTHORIZED.value())
            .error("Unauthorized")
            .message("Authentication required")
            .path(request.getRequestURI())
            .build();
        
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        response.getWriter().write(mapper.writeValueAsString(errorResponse));
    }
}
```

## Testing Strategies

### Security Integration Tests
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(properties = {"spring.config.location=classpath:application-test.yml"})
class OAuth2SecurityIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Test
    void authenticateUser_WithValidCredentials_ShouldReturnTokens() {
        // Given
        LoginRequest loginRequest = new LoginRequest("testuser", "password");
        
        // When
        ResponseEntity<AuthenticationResponse> response = restTemplate.postForEntity(
            "/auth/login", loginRequest, AuthenticationResponse.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getAccessToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotBlank();
        assertThat(response.getBody().getTokenType()).isEqualTo("Bearer");
    }
    
    @Test
    void accessProtectedResource_WithValidToken_ShouldSucceed() {
        // Given
        String accessToken = getValidAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        // When
        ResponseEntity<String> response = restTemplate.exchange(
            "/api/inventory", HttpMethod.GET, new HttpEntity<>(headers), String.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
    
    @Test
    void accessProtectedResource_WithoutToken_ShouldFail() {
        // When
        ResponseEntity<String> response = restTemplate.getForEntity("/api/inventory", String.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    
    @Test
    void refreshToken_WithValidRefreshToken_ShouldReturnNewTokens() {
        // Given
        String refreshToken = getValidRefreshToken();
        RefreshTokenRequest request = new RefreshTokenRequest(refreshToken);
        
        // When
        ResponseEntity<AuthenticationResponse> response = restTemplate.postForEntity(
            "/auth/refresh", request, AuthenticationResponse.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getAccessToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotBlank();
        assertThat(response.getBody().getRefreshToken()).isNotEqualTo(refreshToken); // Rotation
    }
}
```

### JWT Token Tests
```java
@ExtendWith(MockitoExtension.class)
class JwtTokenProviderTest {
    
    @Mock
    private CustomUserDetailsService userDetailsService;
    
    @InjectMocks
    private JwtTokenProvider jwtTokenProvider;
    
    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "testSecret");
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenValidityInMilliseconds", 3600000L);
    }
    
    @Test
    void generateToken_ShouldCreateValidJWT() {
        // Given
        UserPrincipal userPrincipal = createTestUserPrincipal();
        
        // When
        String token = jwtTokenProvider.generateToken(userPrincipal);
        
        // Then
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUserIdFromToken(token)).isEqualTo(userPrincipal.getId());
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo(userPrincipal.getUsername());
    }
    
    @Test
    void validateToken_WithExpiredToken_ShouldReturnFalse() {
        // Given
        ReflectionTestUtils.setField(jwtTokenProvider, "accessTokenValidityInMilliseconds", -1000L);
        UserPrincipal userPrincipal = createTestUserPrincipal();
        String expiredToken = jwtTokenProvider.generateToken(userPrincipal);
        
        // When
        boolean isValid = jwtTokenProvider.validateToken(expiredToken);
        
        // Then
        assertThat(isValid).isFalse();
    }
    
    @Test
    void validateToken_WithInvalidSignature_ShouldReturnFalse() {
        // Given
        String tokenWithInvalidSignature = "eyJhbGciOiJIUzUxMiJ9.invalid.signature";
        
        // When
        boolean isValid = jwtTokenProvider.validateToken(tokenWithInvalidSignature);
        
        // Then
        assertThat(isValid).isFalse();
    }
}
```

## Future Enhancements

### OAuth 2.1 and Security Improvements
1. **PKCE Support**: Proof Key for Code Exchange for enhanced security
2. **Device Flow**: Support for IoT and device authentication
3. **mTLS**: Mutual TLS for service-to-service authentication
4. **DPoP**: Demonstration of Proof-of-Possession tokens

### Multi-Factor Authentication
1. **TOTP Support**: Time-based One-Time Password integration
2. **SMS/Email OTP**: Additional verification methods
3. **Biometric Authentication**: Fingerprint and face recognition
4. **Hardware Tokens**: FIDO2/WebAuthn support

### Advanced Authorization
1. **ABAC**: Attribute-Based Access Control for fine-grained permissions
2. **Dynamic Permissions**: Runtime permission evaluation
3. **Policy Engine**: External authorization policy management
4. **Zero-Trust Architecture**: Continuous verification and least privilege

### Monitoring and Analytics
1. **Security Dashboards**: Real-time security monitoring
2. **Anomaly Detection**: ML-based suspicious activity detection
3. **Compliance Reporting**: Automated security compliance reports
4. **Threat Intelligence**: Integration with security threat feeds

## Related Documentation

- [Service Layer Overview](/docs/architecture/services/README.md)
- [Security Architecture](/docs/architecture/security/README.md)
- [API Authentication Guide](/docs/api/endpoints/authentication.md)
- [Role-Based Access Control](../patterns/rbac-patterns.md)
- [JWT Token Management](../patterns/jwt-patterns.md)
- [Security Testing Guide](../testing/security/README.md)