# ErrorResponse Structure

**Status**: Complete | **Last Updated**: 2025-11-20 | **Version**: 1.0.0

**Back to**: [Exception Architecture Index](./index.md) | [Architecture Overview](../index.md)

---

## Overview

The `ErrorResponse` class is a **standardized DTO (Data Transfer Object)** that defines the structure of all error responses returned by the Smart Supply Pro backend API. It provides a **consistent, predictable format** for clients to parse error information, track requests, and implement robust error handling.

**Key Features**:
- ✅ Immutable error response objects
- ✅ Fluent builder pattern for easy construction
- ✅ Automatic timestamp generation (ISO-8601 UTC)
- ✅ Automatic correlation ID generation for request tracking
- ✅ Normalized error tokens for client-side error handling
- ✅ JSON serialization via getters (Spring auto-detects them)

---

## JSON Response Structure

### Standard Error Response Format

All API errors return this JSON structure:

```json
{
  "error": "bad_request",
  "message": "Validation failed: email is required",
  "timestamp": "2025-11-20T14:30:45.123Z",
  "correlationId": "SSP-1700551445123-4891"
}
```

### Field Definitions

| Field | Type | Example | Purpose |
|-------|------|---------|---------|
| **error** | String | `"bad_request"` | Machine-readable error code (lowercase HTTP status name) |
| **message** | String | `"Email is required"` | Human-readable description of the error |
| **timestamp** | String (ISO-8601) | `"2025-11-20T14:30:45.123Z"` | UTC timestamp when error occurred |
| **correlationId** | String | `"SSP-1700551445123-4891"` | Unique ID linking client request to server logs |

---

## Field Details

### Field 1: error

**Type**: String (machine-readable)

**Format**: Lowercase HTTP status name (e.g., "bad_request", "unauthorized", "not_found")

**Valid Values**:
- `"bad_request"` – 400 Bad Request (validation, parameter errors)
- `"unauthorized"` – 401 Unauthorized (authentication failure)
- `"forbidden"` – 403 Forbidden (authorization failure)
- `"not_found"` – 404 Not Found (resource doesn't exist)
- `"conflict"` – 409 Conflict (duplicate, concurrent update)
- `"internal_server_error"` – 500 Internal Server Error (unhandled exception)

**Derivation**:
```java
public Builder status(HttpStatus status) {
    this.status = status;
    this.error = status.name().toLowerCase(); // e.g., BAD_REQUEST → "bad_request"
    return this;
}
```

**Usage in Frontend**:
```javascript
// Switch on error token for specific handling
switch (error.response.data.error) {
    case 'bad_request':
        // Show validation errors to user
        displayValidationForm(error.response.data);
        break;
    case 'unauthorized':
        // Redirect to login
        redirectToLogin();
        break;
    case 'conflict':
        // Show conflict resolution dialog
        showConflictDialog(error.response.data);
        break;
}
```

---

### Field 2: message

**Type**: String (human-readable)

**Purpose**: Describes the error in plain language for users and developers.

**Content Guidelines**:
- ✅ Specific: "Validation failed: email must be valid format"
- ✅ Actionable: "Missing required field: quantity"
- ✅ User-friendly: "Password must be at least 8 characters"
- ❌ Generic: "Error occurred" (not specific)
- ❌ Leaky: Shows SQL or schema details (security risk)
- ❌ Too long: Abbreviated for readability

**Examples**:

```json
// Validation failure
{
  "error": "bad_request",
  "message": "Validation failed: email is required, password must be at least 8 characters"
}

// Conflict
{
  "error": "conflict",
  "message": "Supplier with name 'ACME Inc' already exists"
}

// Authentication
{
  "error": "unauthorized",
  "message": "Authentication failed: invalid credentials or expired session"
}

// Not found
{
  "error": "not_found",
  "message": "Supplier with ID 999 not found"
}

// Server error (generic to prevent information disclosure)
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred. Please contact support."
}
```

**Fallback Behavior**:
```java
public Builder message(String message) {
    this.message = (message == null || message.isBlank()) 
        ? (status != null ? status.getReasonPhrase() : "Unknown error")
        : message;
    return this;
}
```

If no message provided, uses HTTP status reason phrase (e.g., "Bad Request", "Unauthorized").

---

### Field 3: timestamp

**Type**: String (ISO-8601 format)

**Format**: `"YYYY-MM-DDTHH:mm:ss.sssZ"` (UTC/Zulu time)

**Example**: `"2025-11-20T14:30:45.123Z"`

**Generation**:
```java
if (this.timestamp == null) {
    this.timestamp = Instant.now().toString();
}
```

**Uses**:
- 🔍 Correlate with server-side logs by timestamp
- 📊 Track error frequency over time
- 🔗 Order errors chronologically
- 📈 Analyze error patterns across request history

**Parsing in Frontend**:
```javascript
const errorTime = new Date(error.response.data.timestamp);
console.log(`Error occurred at: ${errorTime.toLocaleString()}`);

// Calculate time difference
const now = new Date();
const timeDiff = now - errorTime;
console.log(`Error was ${timeDiff}ms ago`);
```

**ISO-8601 Format Details**:
- ✅ UTC/Zulu time (ends with 'Z')
- ✅ No timezone offset (always UTC)
- ✅ Millisecond precision (3 decimal places)
- ✅ Sortable as string (YYYY-MM-DD order)

---

### Field 4: correlationId

**Type**: String (unique identifier)

**Format**: `"SSP-{timestamp}-{randomNumber}"`

**Example**: `"SSP-1700551445123-4891"`

**Generation**:
```java
private String generateCorrelationId() {
    return "SSP-" + System.currentTimeMillis() + "-" + 
           ThreadLocalRandom.current().nextInt(1000, 9999);
}
```

**Components**:
- **"SSP"** – Project prefix (Smart Supply Pro)
- **{timestamp}** – Current milliseconds (uniqueness across time)
- **{randomNumber}** – 4-digit random number (uniqueness in same millisecond)

**Example Generation**:
```
Timestamp: 1700551445123 (Nov 20, 2025 14:30:45.123 UTC)
Random: 4891
Correlation ID: SSP-1700551445123-4891
```

---

## Correlation ID Benefits

### For Debugging

**Frontend Side**:
```javascript
try {
    await api.post('/suppliers', data);
} catch (error) {
    const correlationId = error.response.data.correlationId;
    console.error(`Error occurred: ${correlationId}`);
    // User reports: "I got error SSP-1700551445123-4891"
}
```

**Backend Side** (finding the error):
```bash
# Search logs for the correlation ID
grep "SSP-1700551445123-4891" application.log

# Result: Full stack trace with complete error details
# (only shown server-side, never to client)
```

### Request Tracking

```
Client Request:
  POST /api/suppliers
  → Generates correlation ID: SSP-1700551445123-4891

Server Processing:
  → MDC (Mapped Diagnostic Context) includes correlation ID
  → All log lines include: [SSP-1700551445123-4891] 
  → Database queries also logged with correlation ID
  → Response includes same correlation ID

Client receives error with correlation ID:
  → Can cite exact error occurrence for support
  → Enables precise server-side investigation
```

### Error Pattern Analysis

```javascript
// Aggregate error metrics
const errorLog = [
    { error: 'bad_request', count: 145, time: '2025-11-20T10:00:00Z' },
    { error: 'conflict', count: 32, time: '2025-11-20T11:00:00Z' },
    { error: 'unauthorized', count: 8, time: '2025-11-20T12:00:00Z' }
];

// Find spike in 400 errors → investigate validation rules
// Find spike in 409 errors → investigate concurrency issues
```

---

## ErrorResponse Implementation

### Complete Class Code

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

    // Getters (used by Spring JSON serialization)
    public String getError() { return error; }
    public String getMessage() { return message; }
    public String getTimestamp() { return timestamp; }
    public String getCorrelationId() { return correlationId; }

    // Builder for fluent construction
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String error;
        private String message;
        private String timestamp;
        private String correlationId;
        private HttpStatus status;

        public Builder status(HttpStatus status) {
            this.status = status;
            this.error = status.name().toLowerCase();
            return this;
        }

        public Builder message(String message) {
            this.message = (message == null || message.isBlank()) 
                ? (status != null ? status.getReasonPhrase() : "Unknown error")
                : message;
            return this;
        }

        public ResponseEntity<ErrorResponse> build() {
            // Auto-generate timestamp if not provided
            if (this.timestamp == null) {
                this.timestamp = Instant.now().toString();
            }
            // Auto-generate correlation ID if not provided
            if (this.correlationId == null) {
                this.correlationId = generateCorrelationId();
            }
            
            ErrorResponse response = new ErrorResponse(this);
            return ResponseEntity.status(status)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response);
        }

        private String generateCorrelationId() {
            return "SSP-" + System.currentTimeMillis() + "-" + 
                   ThreadLocalRandom.current().nextInt(1000, 9999);
        }
    }
}
```

**Key Design**:
- ✅ **Immutable** – No setters, only private fields
- ✅ **Builder Pattern** – Fluent, chainable construction
- ✅ **Auto-Generation** – Timestamp and correlation ID auto-created
- ✅ **Type-Safe** – HttpStatus enum prevents invalid error tokens
- ✅ **JSON-Ready** – Getter methods enable automatic serialization

### Usage Examples

**In Exception Handler**:
```java
@ExceptionHandler(ValidationException.class)
public ResponseEntity<ErrorResponse> handleValidation(ValidationException ex) {
    return ErrorResponse.builder()
            .status(HttpStatus.BAD_REQUEST)
            .message("Validation failed: " + ex.getMessage())
            .build();
}
```

**With Custom Message**:
```java
return ErrorResponse.builder()
        .status(HttpStatus.CONFLICT)
        .message("Supplier name 'ACME' already exists in database")
        .build();
```

**Fallback to Status Reason**:
```java
return ErrorResponse.builder()
        .status(HttpStatus.NOT_FOUND)
        // No .message() call → defaults to "Not Found"
        .build();
```

---

## HTTP Status to Error Token Mapping

```java
// HTTP Status → Error Token (lowercase)

HttpStatus.BAD_REQUEST              → "bad_request"
HttpStatus.UNAUTHORIZED             → "unauthorized"
HttpStatus.FORBIDDEN                → "forbidden"
HttpStatus.NOT_FOUND                → "not_found"
HttpStatus.CONFLICT                 → "conflict"
HttpStatus.INTERNAL_SERVER_ERROR    → "internal_server_error"
```

**Why Lowercase?**
- ✅ RESTful convention (JSON uses camelCase/lowercase)
- ✅ Easier to handle in JavaScript (no constant conversion)
- ✅ Consistent with JSON field naming
- ✅ Less verbose than ENUM names (BAD_REQUEST vs bad_request)

---

## Response Entity Construction

The builder returns a **ResponseEntity**:

```java
public ResponseEntity<ErrorResponse> build() {
    // ... generate timestamp and correlation ID ...
    
    ErrorResponse response = new ErrorResponse(this);
    return ResponseEntity.status(status)
            .contentType(MediaType.APPLICATION_JSON)
            .body(response);
}
```

**Result**:
```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "bad_request",
  "message": "Validation failed: email is required",
  "timestamp": "2025-11-20T14:30:45.123Z",
  "correlationId": "SSP-1700551445123-4891"
}
```

---

## Frontend Integration

### Parsing Error Responses

```typescript
// TypeScript interface for type safety
interface ErrorResponse {
    error: string;
    message: string;
    timestamp: string;
    correlationId: string;
}

// Error handler utility
function handleApiError(error: AxiosError<ErrorResponse>) {
    const errorData = error.response?.data;
    
    if (!errorData) {
        console.error('Unknown error occurred');
        return;
    }
    
    console.error(`[${errorData.correlationId}] ${errorData.error}: ${errorData.message}`);
    console.error(`Time: ${errorData.timestamp}`);
}
```

### Usage in Components

```javascript
async function submitSupplier(formData) {
    try {
        const response = await api.post('/suppliers', formData);
        showSuccessMessage('Supplier created successfully');
    } catch (error) {
        const errorData = error.response.data;
        
        // Log with correlation ID for debugging
        console.error(`Error ${errorData.correlationId}: ${errorData.message}`);
        
        // Show user-friendly message
        showErrorMessage(errorData.message);
        
        // Allow user to copy correlation ID for support
        showSupportInfo(`Report ID: ${errorData.correlationId}`);
    }
}
```

### Error Logging Service

```typescript
export class ErrorLogger {
    log(error: ErrorResponse, context?: string) {
        const logEntry = {
            timestamp: error.timestamp,
            correlationId: error.correlationId,
            errorCode: error.error,
            message: error.message,
            context: context || 'Unknown context',
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Send to analytics/logging service
        analytics.logError(logEntry);
        
        // Store in local sessionStorage for support team
        sessionStorage.setItem('lastError', JSON.stringify(logEntry));
    }
}
```

---

## JSON Serialization

### Spring Jackson Serialization

Spring Framework automatically serializes ErrorResponse to JSON:

```java
ObjectMapper mapper = new ObjectMapper();
ErrorResponse error = ErrorResponse.builder()
        .status(HttpStatus.BAD_REQUEST)
        .message("Invalid input")
        .build();

// Serializes to:
// {"error":"bad_request","message":"Invalid input","timestamp":"2025-11-20T14:30:45.123Z","correlationId":"SSP-..."}
```

**How It Works**:
1. Spring detects ResponseEntity<ErrorResponse>
2. Looks for getter methods (getError(), getMessage(), etc.)
3. Maps method names to JSON fields (getError → "error")
4. Uses Jackson to serialize to JSON

**Field Order** (from getter method order):
```java
getError()          → "error"
getMessage()        → "message"
getTimestamp()      → "timestamp"
getCorrelationId()  → "correlationId"
```

---

## Testing Error Responses

### Unit Test Example

```java
@Test
void testErrorResponseBuilder() {
    ErrorResponse error = ErrorResponse.builder()
            .status(HttpStatus.CONFLICT)
            .message("Resource already exists")
            .build()
            .getBody();
    
    assertThat(error).isNotNull();
    assertThat(error.getError()).isEqualTo("conflict");
    assertThat(error.getMessage()).isEqualTo("Resource already exists");
    assertThat(error.getTimestamp()).isNotBlank();
    assertThat(error.getCorrelationId())
            .startsWith("SSP-")
            .matches("SSP-\\d+-\\d{4}");
}
```

### Integration Test Example

```java
@Test
void testValidationErrorResponse() throws Exception {
    MockHttpServletResponse response = mockMvc.perform(
            post("/api/suppliers")
                    .contentType(APPLICATION_JSON)
                    .content("{\"name\": \"\"}") // Empty name
    )
    .andExpect(status().isBadRequest())
    .andReturn()
    .getResponse();
    
    String body = response.getContentAsString();
    JsonNode json = objectMapper.readTree(body);
    
    assertThat(json.get("error").asText()).isEqualTo("bad_request");
    assertThat(json.get("message").asText()).contains("Validation");
    assertThat(json.get("timestamp").asText()).matches(ISO8601_PATTERN);
    assertThat(json.get("correlationId").asText()).matches("SSP-\\d+-\\d{4}");
}
```

---

## Security Considerations

### Information Disclosure Prevention

**Bad Practice** ❌:
```json
{
  "error": "internal_server_error",
  "message": "NullPointerException in SupplierService.java:45 while processing SQL query: SELECT * FROM SUPPLIERS WHERE id = ?",
  "timestamp": "...",
  "correlationId": "..."
}
```

**Good Practice** ✅:
```json
{
  "error": "internal_server_error",
  "message": "An unexpected error occurred. Please contact support.",
  "timestamp": "...",
  "correlationId": "SSP-1700551445123-4891"
}
```

**Why**: The correlation ID allows support team to look up the detailed error server-side without exposing sensitive information to the client.

### Generic Messages for Auth/Authz

**Bad** ❌:
```json
{
  "error": "unauthorized",
  "message": "User 'john@example.com' not found in database"
}
```

**Good** ✅:
```json
{
  "error": "unauthorized",
  "message": "Authentication failed"
}
```

**Why**: Prevents attacker from determining which email addresses are registered (user enumeration attack).

---

## Comparison with Alternative Designs

### Design Option 1: ErrorResponse (Current)
```json
{
  "error": "bad_request",
  "message": "Email is required",
  "timestamp": "2025-11-20T14:30:45.123Z",
  "correlationId": "SSP-1700551445123-4891"
}
```

**Pros**:
- ✅ Simple, flat structure
- ✅ Easy to parse
- ✅ Includes correlation ID for debugging
- ✅ ISO-8601 timestamp

**Cons**:
- ❌ No field-level error details
- ❌ Single message for all validation errors

### Design Option 2: With Field Errors
```json
{
  "error": "bad_request",
  "message": "Validation failed",
  "fieldErrors": {
    "email": "must be valid format",
    "password": "must be at least 8 characters"
  },
  "timestamp": "...",
  "correlationId": "..."
}
```

**Pros**:
- ✅ Detailed field-level errors
- ✅ Structured error data

**Cons**:
- ❌ More complex parsing
- ❌ Optional fieldErrors make parsing harder

### Smart Supply Pro Choice

We use **Option 1 (Simple)** because:
- ✅ Validation errors handled by InvalidRequestException with structured field details
- ✅ Keeps ErrorResponse DTOresponse lightweight
- ✅ Domain exceptions can include context in their fields
- ✅ Frontend can parse message string if needed

---

## Related Documentation

- **[Exception Architecture Overview](./index.md)** – Exception types, handler ordering, execution flow
- **[Global Exception Handler](./global-exception-handler.md)** – How ErrorResponse is built in exception handlers
- **[Domain Exceptions](./domain-exceptions.md)** – Custom exceptions that populate ErrorResponse
- **[Exception-to-HTTP Mapping](./exception-to-http-mapping.md)** – Complete status code mapping reference
- **[Guidelines & Best Practices](./guidelines-and-best-practices.md)** – Best practices for error handling

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-11-20 | Initial comprehensive documentation |

---

## Quick Reference

### ErrorResponse JSON Template

```json
{
  "error": "[error-token]",
  "message": "[human-readable message]",
  "timestamp": "[ISO-8601 UTC timestamp]",
  "correlationId": "[SSP-{timestamp}-{random}]"
}
```

### Builder Usage

```java
// Basic usage
ErrorResponse.builder()
        .status(HttpStatus.BAD_REQUEST)
        .message("Error description")
        .build();

// With multiple chained calls
ErrorResponse.builder()
        .status(HttpStatus.CONFLICT)
        .message("Resource already exists")
        .build();

// Fallback to status reason phrase
ErrorResponse.builder()
        .status(HttpStatus.NOT_FOUND)
        // message() not called → defaults to "Not Found"
        .build();
```

### Error Token Lookup

| Token | HTTP Status | Meaning |
|-------|-------------|---------|
| `bad_request` | 400 | Validation or parameter error |
| `unauthorized` | 401 | Authentication failed |
| `forbidden` | 403 | Authorization failed |
| `not_found` | 404 | Resource not found |
| `conflict` | 409 | Duplicate or concurrent update |
| `internal_server_error` | 500 | Unhandled exception |
