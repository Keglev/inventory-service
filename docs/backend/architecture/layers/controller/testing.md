[⬅️ Back to Controller Index](./index.md)

# Testing Controller Layer

The **Testing** responsibility covers unit and integration testing strategies for controllers.

## Testing Strategy

Controllers are tested via integration tests using Spring's test framework:

- Use `@SpringBootTest` for full application context
- Use `MockMvc` for HTTP request simulation
- Mock service layer to isolate controller logic
- Verify routing, status codes, response structure
- Test error handling and exception mapping

## Integration Test Example

```java
@SpringBootTest
class SupplierControllerTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @MockBean
    private SupplierService supplierService;
    
    @Test
    void testCreateSupplierSuccess() throws Exception {
        // Arrange
        CreateSupplierDTO createDto = CreateSupplierDTO.builder()
            .name("ACME Corp")
            .contactName("John Doe")
            .contactEmail("john@acme.com")
            .phoneNumber("5551234567")
            .minOrderQuantity(10)
            .build();
        
        SupplierDTO savedDto = SupplierDTO.builder()
            .id("abc123")
            .name("ACME Corp")
            .contactName("John Doe")
            .build();
        
        when(supplierService.create(any(CreateSupplierDTO.class)))
            .thenReturn(savedDto);
        
        // Act & Assert
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(createDto)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value("abc123"))
            .andExpect(jsonPath("$.name").value("ACME Corp"));
    }
    
    @Test
    void testCreateSupplierValidationFailure() throws Exception {
        // Missing required field
        CreateSupplierDTO invalidDto = CreateSupplierDTO.builder()
            .name("")  // Empty name
            .contactName("John Doe")
            .build();
        
        mockMvc.perform(post("/api/suppliers")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(invalidDto)))
            .andExpect(status().isBadRequest());
    }
    
    @Test
    void testDeleteSupplierUnauthorized() throws Exception {
        // No authorization, should fail
        mockMvc.perform(delete("/api/suppliers/abc123"))
            .andExpect(status().isForbidden());
    }
}
```

## Testing Patterns

### Test Successful Endpoint

```java
@Test
void testGetSupplierSuccess() throws Exception {
    SupplierDTO supplier = SupplierDTO.builder()
        .id("abc123")
        .name("ACME Corp")
        .build();
    
    when(supplierService.findById("abc123"))
        .thenReturn(Optional.of(supplier));
    
    mockMvc.perform(get("/api/suppliers/abc123")
        .with(user("testuser").roles("USER")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("abc123"));
}
```

### Test Not Found Error

```java
@Test
void testGetSupplierNotFound() throws Exception {
    when(supplierService.findById("nonexistent"))
        .thenReturn(Optional.empty());
    
    mockMvc.perform(get("/api/suppliers/nonexistent"))
        .andExpect(status().isNotFound());
}
```

### Test Authorization

```java
@Test
void testDeleteSupplierAsAdmin() throws Exception {
    mockMvc.perform(delete("/api/suppliers/abc123")
        .with(user("admin").roles("ADMIN")))
        .andExpect(status().isNoContent());
    
    verify(supplierService).delete("abc123");
}

@Test
void testDeleteSupplierAsUser() throws Exception {
    // USER role lacks permission
    mockMvc.perform(delete("/api/suppliers/abc123")
        .with(user("user").roles("USER")))
        .andExpect(status().isForbidden());
}
```

### Test Validation

```java
@Test
void testCreateSupplierInvalidEmail() throws Exception {
    CreateSupplierDTO invalidDto = CreateSupplierDTO.builder()
        .name("ACME Corp")
        .contactEmail("invalid-email")  // Not valid email format
        .build();
    
    mockMvc.perform(post("/api/suppliers")
        .contentType(MediaType.APPLICATION_JSON)
        .content(objectMapper.writeValueAsString(invalidDto))
        .with(user("admin").roles("ADMIN")))
        .andExpect(status().isBadRequest());
}
```

## Test Annotations

- `@SpringBootTest` - Loads full application context for integration tests
- `@MockBean` - Replaces service beans with mocks
- `@Autowired` - Injects MockMvc for simulating HTTP requests
- `@Test` - Marks method as test case

## MockMvc Methods

- `mockMvc.perform(request)` - Execute HTTP request simulation
- `post()`, `get()`, `put()`, `delete()` - HTTP method builders
- `.contentType(MediaType.APPLICATION_JSON)` - Set request content type
- `.content()` - Set request body
- `.andExpect(status().isOk())` - Assert HTTP status code
- `.andExpect(jsonPath())` - Assert JSON response structure
- `.with(user())` - Add Spring Security user context

---

[⬅️ Back to Controller Index](./index.md)
