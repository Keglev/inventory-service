[⬅️ Back to DTO Hub](./index.md)

# Error & Problem Details DTOs

## Overview

All error responses follow a **single standardized format** across all endpoints, regardless of error type or HTTP status. This consistency enables predictable client-side error handling.

**DTO Class:** `ErrorResponse` (builder pattern)  
**Handler:** `GlobalExceptionHandler`  
**Scope:** All 4xx and 5xx responses

---

## ErrorResponse Structure

### Standard Error Response

```json
{
  "error": "bad_request",
  "message": "Validation failed: email is required",
  "timestamp": "2025-11-19T12:34:56.789Z",
  "correlationId": "SSP-1700123456789-4523"
}
```

### Field Reference

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `error` | String | Normalized error code (HTTP status name in lowercase) | `"bad_request"`, `"unauthorized"`, `"not_found"` |
| `message` | String | Human-readable error description | `"Validation failed: email is required"` |
| `timestamp` | String | ISO-8601 UTC timestamp | `"2025-11-19T12:34:56.789Z"` |
| `correlationId` | String | Unique request tracking ID | `"SSP-1700123456789-4523"` |

---

## ErrorResponse Java Implementation

```java
public class ErrorResponse {

    private final String error;
    private final String message;
    private final String timestamp;
    private final String correlationId;

    private ErrorResponse(Builder builder) {
        this.error = builder.error;
        this.message = builder.message;
        this.timestamp = builder.timestamp;
        this.correlationId = builder.correlationId;
    }

    public static Builder builder() {
        return new Builder();
    }

    /**
     * Fluent builder for ErrorResponse construction.
     */
    public static class Builder {
        private String error;
        private String message;
        private String timestamp;
        private String correlationId;
        private HttpStatus status;

        /**
         * Sets HTTP status and derives normalized error token.
         * @param status HTTP status code
         * @return this builder for chaining
         */
        public Builder status(HttpStatus status) {
            this.status = status;
            // e.g., BAD_REQUEST → "bad_request"
            this.error = status.name().toLowerCase();
            this.timestamp = Instant.now().toString();
            this.correlationId = generateCorrelationId();
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public ErrorResponse build() {
            if (error == null) {
                throw new IllegalStateException("Error code must be set via status()");
            }
            if (message == null) {
                throw new IllegalStateException("Message is required");
            }
            return new ErrorResponse(this);
        }

        private String generateCorrelationId() {
            long timestamp = System.currentTimeMillis();
            int random = ThreadLocalRandom.current().nextInt(10000);
            return "SSP-" + timestamp + "-" + random;
        }
    }

    // Getters (for JSON serialization)
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getTimestamp() { return timestamp; }
    public String getCorrelationId() { return correlationId; }
}
```

---

## Error Scenarios by HTTP Status

### 400 Bad Request (Validation)

**When:** Request body fails validation (missing required fields, invalid format)

**Example 1: Missing Required Field**

**Request:**

```http
POST /api/suppliers
Content-Type: application/json

{
  "contactName": "John",
  "email": "invalid-email"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "bad_request",
  "message": "Validation failed: Name is required; Invalid email format",
  "timestamp": "2025-11-19T10:35:00.789Z",
  "correlationId": "SSP-1700123456789-4523"
}
```

**Example 2: Invalid Type**

**Request:**

```http
PATCH /api/items/ITEM-001/update-stock
Content-Type: application/json

{
  "newQuantity": "abc",
  "reason": "received"
}
```

**Response (400 Bad Request):**

```json
{
  "error": "bad_request",
  "message": "Failed to parse request body: 'abc' is not a valid integer",
  "timestamp": "2025-11-19T10:36:00.789Z",
  "correlationId": "SSP-1700123456789-5624"
}
```

---

### 401 Unauthorized (Authentication)

**When:** User is not authenticated, or authentication is invalid

**Request (no Authorization header):**

```http
GET /api/suppliers
```

**Response (401 Unauthorized):**

```json
{
  "error": "unauthorized",
  "message": "User not authenticated",
  "timestamp": "2025-11-19T10:37:00.789Z",
  "correlationId": "SSP-1700123456789-6725"
}
```

**Request (invalid token):**

```http
GET /api/suppliers
Authorization: Bearer invalid-token-format
```

**Response (401 Unauthorized):**

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token",
  "timestamp": "2025-11-19T10:38:00.789Z",
  "correlationId": "SSP-1700123456789-7826"
}
```

---

### 403 Forbidden (Authorization)

**When:** User is authenticated but lacks required role/permission

**Request (USER trying to create):**

```http
POST /api/suppliers
Content-Type: application/json
Authorization: Bearer <user-token>

{ "name": "New Corp", ... }
```

**Response (403 Forbidden):**

```json
{
  "error": "forbidden",
  "message": "User does not have required role: ADMIN",
  "timestamp": "2025-11-19T10:39:00.789Z",
  "correlationId": "SSP-1700123456789-8927"
}
```

---

### 404 Not Found (Resource)

**When:** Requested resource does not exist

**Request:**

```http
GET /api/suppliers/SUP-INVALID
Authorization: Bearer <token>
```

**Response (404 Not Found):**

```json
{
  "error": "not_found",
  "message": "Supplier with ID 'SUP-INVALID' not found",
  "timestamp": "2025-11-19T10:40:00.789Z",
  "correlationId": "SSP-1700123456789-9028"
}
```

---

### 409 Conflict (Data Integrity)

**When:** Operation violates database constraints (e.g., duplicate key)

**Request (duplicate email):**

```http
POST /api/suppliers
Content-Type: application/json

{
  "name": "ACME Corp",
  "email": "acme@example.com"  (already exists)
}
```

**Response (409 Conflict):**

```json
{
  "error": "conflict",
  "message": "Email 'acme@example.com' already exists",
  "timestamp": "2025-11-19T10:41:00.789Z",
  "correlationId": "SSP-1700123456789-0129"
}
```

---

### 500 Internal Server Error (Unhandled)

**When:** Unexpected server error (not caught or handled)

**Request (database connection fails):**

```http
GET /api/suppliers
Authorization: Bearer <token>
```

**Response (500 Internal Server Error):**

```json
{
  "error": "internal_server_error",
  "message": "Database connection timeout",
  "timestamp": "2025-11-19T10:42:00.789Z",
  "correlationId": "SSP-1700123456789-1230"
}
```

---

## Error Codes (HTTP Status to Error String)

| HTTP Status | Error Code | Scenario |
|-------------|-----------|----------|
| 400 | `bad_request` | Validation failure, malformed request |
| 401 | `unauthorized` | Not authenticated |
| 403 | `forbidden` | Authenticated but not authorized |
| 404 | `not_found` | Resource does not exist |
| 409 | `conflict` | Data integrity violation (unique constraint) |
| 500 | `internal_server_error` | Unhandled exception |
| 503 | `service_unavailable` | Database/external service down |

---

## GlobalExceptionHandler Integration

The exception handler automatically converts exceptions to `ErrorResponse`:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handle validation errors (missing required fields).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException ex) {
        
        String message = ex.getBindingResult().getFieldErrors()
            .stream()
            .map(e -> e.getDefaultMessage())
            .collect(Collectors.joining("; "));

        return ResponseEntity.badRequest()
            .body(ErrorResponse.builder()
                .status(HttpStatus.BAD_REQUEST)
                .message("Validation failed: " + message)
                .build());
    }

    /**
     * Handle authentication errors.
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(
            AuthenticationException ex) {
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ErrorResponse.builder()
                .status(HttpStatus.UNAUTHORIZED)
                .message("Authentication failed: " + ex.getMessage())
                .build());
    }

    /**
     * Handle authorization errors.
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAuthorization(
            AccessDeniedException ex) {
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ErrorResponse.builder()
                .status(HttpStatus.FORBIDDEN)
                .message("Access denied: " + ex.getMessage())
                .build());
    }

    /**
     * Handle resource not found.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException ex) {
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse.builder()
                .status(HttpStatus.NOT_FOUND)
                .message(ex.getMessage())
                .build());
    }

    /**
     * Handle all other exceptions.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .message("Internal server error: " + ex.getMessage())
                .build());
    }
}
```

---

## Correlation ID Usage

The `correlationId` field allows tracing requests through logs:

**Server logs:**
```
[SSP-1700123456789-4523] POST /api/suppliers
[SSP-1700123456789-4523] Validation failed: Email is required
[SSP-1700123456789-4523] Response: 400 Bad Request
```

**Client logs:**
```javascript
console.error('Failed with correlation ID:', error.correlationId);
// User can provide this ID to support
```

**Support can search logs by correlation ID to debug issues.**

---

## Client Error Handling

### JavaScript Example

```javascript
async function apiCall(method, path, body) {
  try {
    const response = await fetch(path, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      
      // Show user-friendly error
      console.error(`Error [${error.error}]: ${error.message}`);
      console.log(`Correlation ID: ${error.correlationId} (provide to support)`);
      
      // Handle specific errors
      switch (error.error) {
        case 'bad_request':
          // Show form validation errors
          break;
        case 'unauthorized':
          // Redirect to login
          window.location.href = '/login';
          break;
        case 'forbidden':
          // Show "Access Denied" message
          break;
        case 'not_found':
          // Show "Resource not found" message
          break;
        default:
          // Show generic error
      }
      
      throw new Error(error.message);
    }

    return await response.json();
  } catch (err) {
    console.error('Request failed:', err);
    throw err;
  }
}
```

---

## Testing Error Responses

### Unit Test Template

```java
@WebMvcTest(SupplierController.class)
class SupplierControllerErrorTest {

    @MockBean
    private SupplierService supplierService;

    @Test
    void testGetSupplier_WithInvalidId_Returns404() throws Exception {
        when(supplierService.getSupplier("INVALID"))
            .thenThrow(new ResourceNotFoundException(
                "Supplier with ID 'INVALID' not found"
            ));

        mockMvc.perform(get("/api/suppliers/INVALID"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("not_found"))
            .andExpect(jsonPath("$.message")
                .value("Supplier with ID 'INVALID' not found"))
            .andExpect(jsonPath("$.timestamp").exists())
            .andExpect(jsonPath("$.correlationId").exists());
    }

    @Test
    void testCreateSupplier_WithValidationError_Returns400() throws Exception {
        mockMvc.perform(
            post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"contactName\": \"John\"}")  // Missing name
        )
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("bad_request"))
        .andExpect(jsonPath("$.message").contains("Name is required"));
    }

    @Test
    void testCreateSupplier_WithoutAuth_Returns401() throws Exception {
        mockMvc.perform(
            post("/api/suppliers")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"New Corp\"}")
        )
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.error").value("unauthorized"));
    }
}
```

---

## Summary

| Aspect | Detail |
|--------|--------|
| **DTO Class** | `ErrorResponse` (immutable with builder) |
| **Fields** | error, message, timestamp, correlationId |
| **Error Code** | HTTP status name in lowercase |
| **Message** | Human-readable and actionable |
| **Timestamp** | ISO-8601 UTC format |
| **Correlation ID** | Unique tracking ID for debugging |
| **Handler** | `GlobalExceptionHandler` for all exceptions |
| **Consistency** | Same structure for all 4xx/5xx responses |

---

[⬅️ Back to DTO Hub](./index.md)
