# Controller Testing Framework Integration Guide

**Spring Boot + JUnit 5 + MockMvc - Complete Integration Reference**

---

## 🔧 **Framework Stack Overview**

### **Core Testing Dependencies**
```xml
<!-- Spring Boot Test Starter -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>

<!-- Spring Security Test -->
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

### **Framework Integration Architecture**
```mermaid
graph TD
    subgraph "JUnit 5 Platform"
        JU[JUnit Jupiter]
        AS[Assertions]
        EX[Extensions]
    end
    
    subgraph "Spring Boot Test"
        SBT[Spring Boot Test]
        WMT[@WebMvcTest]
        TC[Test Configuration]
    end
    
    subgraph "MockMvc Framework"
        MVC[MockMvc]
        RB[Request Builders]
        RM[Result Matchers]
    end
    
    subgraph "Security Testing"
        ST[Spring Security Test]
        WMU[@WithMockUser]
        SEC[Security Context]
    end
    
    JU --> SBT
    SBT --> WMT
    WMT --> MVC
    MVC --> RB
    MVC --> RM
    ST --> WMU
    WMU --> SEC
    SEC --> MVC
```

---

## 🏗️ **@WebMvcTest Deep Dive**

### **What @WebMvcTest Includes**
```java
@WebMvcTest(SupplierController.class)
// Automatically configures:
// ✅ MockMvc
// ✅ @Controller, @RestController, @ControllerAdvice beans
// ✅ Spring Security (if present)
// ✅ Jackson ObjectMapper
// ✅ @JsonComponent beans
// ✅ Validation framework
```

### **What @WebMvcTest Excludes**
```java
// ❌ @Service beans (must use @MockBean)
// ❌ @Repository beans  
// ❌ @Component beans (unless explicitly imported)
// ❌ Database configuration
// ❌ JMS, Cache, WebSocket configuration
// ❌ Full application context
```

### **Strategic @Import Usage**
```java
@WebMvcTest(SupplierController.class)
@Import({ 
    GlobalExceptionHandler.class,     // Error handling
    TestSecurityConfig.class,         // Security configuration
    ValidationConfig.class            // Custom validation
})
@MockBean({SupplierService.class, UserSecurityService.class})
class SupplierControllerTest {
    // Optimized test slice configuration
}
```

---

## 🔐 **Security Testing Integration**

### **Spring Security Test Annotations**

#### **@WithMockUser Variants**
```java
// Basic role-based testing
@WithMockUser(roles = "ADMIN")
@Test
void shouldAllowAdminAccess() { /* test */ }

// Custom user with authorities
@WithMockUser(username = "admin", authorities = {"ADMIN", "SUPPLIER_WRITE"})
@Test
void shouldAllowSpecificAuthorities() { /* test */ }

// Anonymous user testing
@WithAnonymousUser
@Test
void shouldDenyAnonymousAccess() { /* test */ }
```

#### **Custom Security Annotations**
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(roles = "ADMIN")
public @interface WithMockAdmin {
}

// Usage:
@WithMockAdmin
@Test
void shouldAllowAdminOperation() { /* test */ }
```

### **MockMvc Security Integration**
```java
// Dynamic role assignment
@Test
void shouldTestDynamicRoles() throws Exception {
    mockMvc.perform(get("/api/suppliers")
        .with(user("testuser").roles("USER")))
        .andExpected(status().isForbidden());
        
    mockMvc.perform(get("/api/suppliers")
        .with(user("testadmin").roles("ADMIN")))
        .andExpected(status().isOk());
}

// OAuth2 authentication simulation
@Test
void shouldTestOAuth2() throws Exception {
    mockMvc.perform(get("/api/secure")
        .with(oauth2Login()
            .attributes(attrs -> attrs.put("sub", "user123"))
            .authorities(new SimpleGrantedAuthority("ROLE_USER"))))
        .andExpected(status().isOk());
}
```

---

## 🎯 **MockMvc Advanced Patterns**

### **Request Builder Patterns**

#### **Standard CRUD Operations**
```java
// GET with parameters
mockMvc.perform(get("/api/suppliers")
    .param("page", "0")
    .param("size", "10")
    .param("sort", "name,asc"))
    .andExpect(status().isOk());

// POST with JSON body
mockMvc.perform(post("/api/suppliers")
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(supplierDTO))
    .with(csrf()))  // CSRF protection
    .andExpect(status().isCreated());

// PUT with path variable
mockMvc.perform(put("/api/suppliers/{id}", supplierId)
    .contentType(MediaType.APPLICATION_JSON)
    .content(objectMapper.writeValueAsString(updatedSupplier)))
    .andExpect(status().isOk());

// DELETE operation
mockMvc.perform(delete("/api/suppliers/{id}", supplierId)
    .with(user("admin").roles("ADMIN")))
    .andExpect(status().isNoContent());
```

#### **Complex Parameter Handling**
```java
// Multiple query parameters
mockMvc.perform(get("/api/analytics/summary")
    .param("startDate", "2025-01-01")
    .param("endDate", "2025-12-31")
    .param("categories", "ELECTRONICS", "CLOTHING")
    .param("includeInactive", "false"))
    .andExpect(status().isOk());

// Request headers
mockMvc.perform(get("/api/suppliers")
    .header("Accept-Language", "en-US")
    .header("X-Requested-With", "XMLHttpRequest"))
    .andExpect(status().isOk());
```

### **Result Matcher Patterns**

#### **Status and Header Validation**
```java
mockMvc.perform(post("/api/suppliers")
    .contentType(MediaType.APPLICATION_JSON)
    .content(supplierJson))
    .andExpect(status().isCreated())
    .andExpect(header().exists("Location"))
    .andExpect(header().string("Content-Type", containsString("application/json")));
```

#### **JSON Response Validation**
```java
mockMvc.perform(get("/api/suppliers/{id}", supplierId))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.id", is(supplierId)))
    .andExpect(jsonPath("$.name", is("Test Supplier")))
    .andExpect(jsonPath("$.contactInfo.email", is("test@example.com")))
    .andExpect(jsonPath("$.active", is(true)));

// Array response validation
mockMvc.perform(get("/api/suppliers"))
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.content", hasSize(greaterThan(0))))
    .andExpect(jsonPath("$.content[0].id", notNullValue()))
    .andExpect(jsonPath("$.totalElements", greaterThan(0)));
```

#### **Error Response Validation**
```java
mockMvc.perform(post("/api/suppliers")
    .contentType(MediaType.APPLICATION_JSON)
    .content(invalidSupplierJson))
    .andExpect(status().isBadRequest())
    .andExpect(jsonPath("$.errors", hasSize(greaterThan(0))))
    .andExpect(jsonPath("$.errors[?(@.field == 'name')].message", 
               hasItem("Name is required")));
```

---

## 🔄 **Test Configuration Patterns**

### **Shared Test Configuration**

#### **TestSecurityConfig Pattern**
```java
@TestConfiguration
public class TestSecurityConfig {
    
    @Bean
    @Primary
    public UserSecurityService mockUserSecurityService() {
        UserSecurityService mockService = Mockito.mock(UserSecurityService.class);
        
        // Standard mock behavior
        when(mockService.hasRole(any(), eq("ADMIN"))).thenReturn(true);
        when(mockService.hasRole(any(), eq("USER"))).thenReturn(true);
        
        return mockService;
    }
    
    @Bean
    @Primary
    public SecurityFilterChain testSecurityFilterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .build();
    }
}
```

#### **ObjectMapper Configuration**
```java
@TestConfiguration
public class TestJacksonConfig {
    
    @Bean
    @Primary
    public ObjectMapper testObjectMapper() {
        return JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
            .build();
    }
}
```

### **Custom Test Annotations**

#### **Composite Test Annotation**
```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@WebMvcTest
@Import({
    GlobalExceptionHandler.class,
    TestSecurityConfig.class,
    TestJacksonConfig.class
})
public @interface ControllerWebTest {
    Class<?>[] controllers() default {};
    Class<?>[] excludeFilters() default {};
}

// Usage simplification:
@ControllerWebTest(controllers = SupplierController.class)
@MockBean({SupplierService.class, UserSecurityService.class})
class SupplierControllerTest {
    // Simplified configuration
}
```

#### **Role-Based Test Annotations**
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(roles = "ADMIN")
public @interface WithMockAdmin {
}

@Target(ElementType.METHOD) 
@Retention(RetentionPolicy.RUNTIME)
@WithMockUser(roles = "USER")
public @interface WithMockUser {
}
```

---

## 🚀 **Performance Testing Integration**

### **Timeout Testing**
```java
@Test
@Timeout(value = 5, unit = TimeUnit.SECONDS)
void shouldCompleteAnalyticsWithinSLA() throws Exception {
    // Performance boundary testing
    mockMvc.perform(get("/api/analytics/complex-report")
        .with(user("admin").roles("ADMIN")))
        .andExpect(status().isOk());
}
```

### **Concurrent Testing**
```java
@Test
void shouldHandleConcurrentRequests() throws Exception {
    int threadCount = 10;
    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    CountDownLatch latch = new CountDownLatch(threadCount);
    
    for (int i = 0; i < threadCount; i++) {
        executor.submit(() -> {
            try {
                mockMvc.perform(get("/api/suppliers")
                    .with(user("user").roles("USER")))
                    .andExpect(status().isOk());
            } catch (Exception e) {
                fail("Concurrent request failed: " + e.getMessage());
            } finally {
                latch.countDown();
            }
        });
    }
    
    assertTrue(latch.await(10, TimeUnit.SECONDS));
}
```

---

## 🧪 **Advanced Testing Utilities**

### **Custom Result Matchers**
```java
public class CustomMatchers {
    
    public static ResultMatcher hasValidationError(String field, String message) {
        return result -> {
            String content = result.getResponse().getContentAsString();
            JsonNode json = new ObjectMapper().readTree(content);
            
            boolean found = false;
            JsonNode errors = json.get("errors");
            if (errors != null && errors.isArray()) {
                for (JsonNode error : errors) {
                    if (field.equals(error.get("field").asText()) &&
                        message.equals(error.get("message").asText())) {
                        found = true;
                        break;
                    }
                }
            }
            
            if (!found) {
                throw new AssertionError(
                    "Expected validation error for field '" + field + 
                    "' with message '" + message + "' not found");
            }
        };
    }
    
    public static ResultMatcher hasSuccessfulPagination() {
        return result -> {
            MockHttpServletResponse response = result.getResponse();
            assertEquals(200, response.getStatus());
            
            String content = response.getContentAsString();
            JsonNode json = new ObjectMapper().readTree(content);
            
            assertTrue(json.has("content"));
            assertTrue(json.has("totalElements"));
            assertTrue(json.has("totalPages"));
            assertTrue(json.get("totalElements").asInt() >= 0);
        };
    }
}
```

### **Request Builder Utilities**
```java
public class RequestBuilders {
    
    public static MockHttpServletRequestBuilder jsonPost(String url, Object body) {
        try {
            return post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(new ObjectMapper().writeValueAsString(body));
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize request body", e);
        }
    }
    
    public static MockHttpServletRequestBuilder authenticatedGet(String url, String role) {
        return get(url).with(user("testuser").roles(role));
    }
    
    public static MockHttpServletRequestBuilder paginatedGet(String url, int page, int size) {
        return get(url)
            .param("page", String.valueOf(page))
            .param("size", String.valueOf(size));
    }
}
```

---

## 📊 **Test Data Management**

### **Test Data Factory Pattern**
```java
public class SupplierTestDataFactory {
    
    public static SupplierDTO createValidSupplier() {
        return SupplierDTO.builder()
            .name("Test Supplier")
            .contactInfo(ContactInfoDTO.builder()
                .email("test@supplier.com")
                .phone("+1-555-0123")
                .build())
            .address(AddressDTO.builder()
                .street("123 Business St")
                .city("Business City")
                .country("US")
                .build())
            .active(true)
            .build();
    }
    
    public static SupplierDTO createInvalidSupplier() {
        return SupplierDTO.builder()
            .name("")  // Invalid: empty name
            .contactInfo(ContactInfoDTO.builder()
                .email("invalid-email")  // Invalid: malformed email
                .build())
            .build();
    }
    
    public static List<SupplierDTO> createSupplierList(int count) {
        return IntStream.range(0, count)
            .mapToObj(i -> createValidSupplier().toBuilder()
                .name("Supplier " + i)
                .build())
            .collect(Collectors.toList());
    }
}
```

### **Database Test Data Setup**
```java
@Sql(scripts = "/test-data/suppliers.sql", executionPhase = BEFORE_TEST_METHOD)
@Sql(scripts = "/test-data/cleanup.sql", executionPhase = AFTER_TEST_METHOD)
class SupplierControllerIntegrationTest {
    // Database-backed integration testing
}
```

---

## 🔍 **Debugging and Troubleshooting**

### **Common @WebMvcTest Issues**

#### **Bean Not Found Errors**
```java
// Problem: Service bean not available in test slice
@WebMvcTest(SupplierController.class)
class SupplierControllerTest {
    // Error: No qualifying bean of type 'SupplierService'
}

// Solution: Add @MockBean
@WebMvcTest(SupplierController.class)
@MockBean(SupplierService.class)
class SupplierControllerTest {
    // Fixed: Mock bean available for injection
}
```

#### **Security Configuration Issues**
```java
// Problem: Security denies all requests
@WebMvcTest(SupplierController.class)
class SupplierControllerTest {
    // All requests return 403 Forbidden
}

// Solution: Import test security configuration
@WebMvcTest(SupplierController.class)
@Import(TestSecurityConfig.class)
class SupplierControllerTest {
    // Fixed: Test security allows requests
}
```

### **MockMvc Debugging**
```java
@Test
void debugTest() throws Exception {
    mockMvc.perform(get("/api/suppliers"))
        .andDo(print())  // Print request/response details
        .andExpect(status().isOk());
}

// Custom debug logging
@Test
void debugWithLogging() throws Exception {
    MvcResult result = mockMvc.perform(get("/api/suppliers"))
        .andReturn();
        
    System.out.println("Response: " + result.getResponse().getContentAsString());
    System.out.println("Status: " + result.getResponse().getStatus());
}
```

---

*Framework Integration Guide - Complete Spring Boot Test Reference*  
*Updated: October 2025 | Version: 1.0*