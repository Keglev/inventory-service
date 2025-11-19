[⬅️ Back to Infrastructure Index](./index.md)

# Exception Handling

The **Exception Handling Layer** provides centralized, consistent error mapping from domain exceptions to HTTP responses. All errors follow a unified response format.

## Global Exception Handler

Centralized exception handling maps domain exceptions to HTTP responses:

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return ResponseEntity.badRequest().body(
            new ErrorResponse("BAD_REQUEST", ex.getMessage(), request.getRequestURI())
        );
    }
    
    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NoSuchElementException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
            new ErrorResponse("NOT_FOUND", "Resource not found", request.getRequestURI())
        );
    }
    
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
            new ErrorResponse("CONFLICT", ex.getMessage(), request.getRequestURI())
        );
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
            new ErrorResponse("FORBIDDEN", "Access denied", request.getRequestURI())
        );
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            new ErrorResponse("INTERNAL_SERVER_ERROR", "Unexpected error", 
                request.getRequestURI())
        );
    }
}
```

## Error Response Structure

Consistent error response format across all endpoints:

```java
@Data
@AllArgsConstructor
public class ErrorResponse {
    private String code;              // BAD_REQUEST, NOT_FOUND, etc.
    private String message;           // Human-readable message
    private String path;              // Request path where error occurred
    private LocalDateTime timestamp;  // When error occurred
    
    public ErrorResponse(String code, String message, String path) {
        this.code = code;
        this.message = message;
        this.path = path;
        this.timestamp = LocalDateTime.now();
    }
}
```

**Example Response:**
```json
{
    "code": "CONFLICT",
    "message": "Supplier 'ACME Corp' already exists",
    "path": "/api/suppliers",
    "timestamp": "2024-11-19T10:30:45"
}
```

---

[⬅️ Back to Infrastructure Index](./index.md)
