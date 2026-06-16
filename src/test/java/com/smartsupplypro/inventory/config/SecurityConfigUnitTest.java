package com.smartsupplypro.inventory.config;

/**
 * {@link SecurityConfig} performs only filter chain wiring with no independently unit-testable decisions.
 * Coverage lives in:
 * <ul>
 *   <li>{@code SecurityConfigAuthorizationRulesTest} — authorization rules and entry point behavior</li>
 *   <li>{@code SecurityConfigDemoReadonlyAuthorizationTest} — demo-readonly branch</li>
 *   <li>{@link CorsConfigTest} — CORS policy and session cookie</li>
 *   <li>{@link OAuth2ConfigTest} — OAuth2 failure handling and authorization request repository</li>
 * </ul>
 */
class SecurityConfigUnitTest {
}
