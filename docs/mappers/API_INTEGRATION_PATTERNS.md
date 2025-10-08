# Mapper API Integration Patterns

**Version:** 1.0  
**Date:** October 8, 2025  
**Purpose:** API Integration Patterns for Entity-DTO Mappers  
**Scope:** REST Controller Integration and Service Layer Boundaries  

## Table of Contents

1. [API Integration Overview](#api-integration-overview)
2. [Controller Integration Patterns](#controller-integration-patterns)
3. [Service Layer Boundaries](#service-layer-boundaries)
4. [REST Endpoint Optimization](#rest-endpoint-optimization)
5. [Request/Response Transformation](#requestresponse-transformation)
6. [Error Handling Integration](#error-handling-integration)
7. [Validation Framework Integration](#validation-framework-integration)
8. [Pagination and Filtering](#pagination-and-filtering)
9. [API Documentation Integration](#api-documentation-integration)
10. [Performance Monitoring Integration](#performance-monitoring-integration)

## API Integration Overview

The Mapper layer serves as the **critical transformation gateway** between the persistence layer and the REST API layer, ensuring clean separation of concerns and optimal data flow.

### API Integration Architecture

```mermaid
graph TB
    A[REST Controller] --> B[Mapper Layer]
    B --> C[Service Layer]
    C --> D[Repository Layer]
    
    A1[HTTP Request] --> A
    A --> A2[RequestDTO]
    A2 --> B1[Mapper.toEntity()]
    B1 --> B2[Entity]
    B2 --> C
    
    C --> C1[Entity Result]
    C1 --> B3[Mapper.toDTO()]
    B3 --> B4[ResponseDTO]
    B4 --> A
    A --> A3[HTTP Response]
    
    style B fill:#e1f5fe
    style B1 fill:#f3e5f5
    style B3 fill:#f3e5f5
```

### Integration Principles

1. **Single Responsibility**: Mappers focus solely on transformation logic
2. **Performance Optimization**: Minimal overhead in request/response cycles
3. **Type Safety**: Compile-time validation of transformations
4. **Error Isolation**: Clean error boundaries between layers
5. **Testability**: Easy unit testing of transformation logic

## Controller Integration Patterns

### Pattern 1: Direct Mapper Integration

**Use Case**: Simple CRUD operations with direct entity-DTO transformation.

#### Inventory Controller Integration Example

```java
@RestController
@RequestMapping("/api/v1/inventory")
@Validated
@Slf4j
public class InventoryController {
    
    private final InventoryService inventoryService;
    
    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }
    
    /**
     * Create new inventory item with optimized mapper integration.
     * 
     * Performance: Direct mapper calls with minimal overhead
     * Validation: Bean validation applied before transformation
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemDTO createInventoryItem(
            @Valid @RequestBody CreateInventoryItemRequest request) {
        
        log.debug("Creating inventory item: {}", request.getName());
        
        // Transform request to entity using optimized mapper
        InventoryItem entity = InventoryItemMapper.toEntity(request);
        
        // Service layer processes entity
        InventoryItem savedEntity = inventoryService.createItem(entity);
        
        // Transform result to response DTO
        InventoryItemDTO response = InventoryItemMapper.toDTO(savedEntity);
        
        log.info("Created inventory item with ID: {}", response.getId());
        return response;
    }
    
    /**
     * Retrieve inventory item by ID with error handling.
     * 
     * Performance: Single mapper call in success path
     * Error Handling: Service exceptions propagated cleanly
     */
    @GetMapping("/{id}")
    public InventoryItemDTO getInventoryItem(@PathVariable Long id) {
        
        log.debug("Retrieving inventory item: {}", id);
        
        // Service layer handles business logic and validation
        InventoryItem entity = inventoryService.findById(id);
        
        // Single transformation call - optimized for performance
        return InventoryItemMapper.toDTO(entity);
    }
    
    /**
     * Update inventory item with partial update support.
     * 
     * Performance: Conditional transformation based on request content
     * Validation: Field-level validation before transformation
     */
    @PutMapping("/{id}")
    public InventoryItemDTO updateInventoryItem(
            @PathVariable Long id,
            @Valid @RequestBody UpdateInventoryItemRequest request) {
        
        log.debug("Updating inventory item: {}", id);
        
        // Transform update request to entity
        InventoryItem updateEntity = InventoryItemMapper.toEntity(request);
        updateEntity.setId(id);  // Ensure ID consistency
        
        // Service layer handles update logic
        InventoryItem updatedEntity = inventoryService.updateItem(updateEntity);
        
        // Transform result to response
        return InventoryItemMapper.toDTO(updatedEntity);
    }
    
    /**
     * Batch operations with collection transformation.
     * 
     * Performance: Stream-based transformation for large collections
     * Memory: Lazy evaluation to handle large datasets
     */
    @GetMapping
    public Page<InventoryItemDTO> getInventoryItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search) {
        
        log.debug("Retrieving inventory items - page: {}, size: {}", page, size);
        
        // Service returns paginated entities
        Page<InventoryItem> entityPage = inventoryService.findAll(
            PageRequest.of(page, size), search);
        
        // Efficient page transformation using mapper
        return entityPage.map(InventoryItemMapper::toDTO);
    }
}
```

**Performance Benefits**:
- **Direct Transformation**: Minimal overhead with static method calls
- **Memory Efficiency**: Stream-based collection transformation
- **Type Safety**: Compile-time validation of mapper calls

### Pattern 2: Conditional Transformation

**Use Case**: API endpoints with optional data inclusion based on request parameters.

#### Advanced Controller Pattern with Conditional Mapping

```java
@RestController
@RequestMapping("/api/v1/inventory")
public class AdvancedInventoryController {
    
    private final InventoryService inventoryService;
    
    /**
     * Flexible inventory retrieval with conditional data inclusion.
     * 
     * Performance: Conditional transformation reduces unnecessary data processing
     * Flexibility: Clients can request only needed data
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getInventoryItem(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean includeHistory,
            @RequestParam(defaultValue = "false") boolean includeSupplier,
            @RequestParam(defaultValue = "basic") String view) {
        
        InventoryItem entity = inventoryService.findById(id);
        
        // Conditional transformation based on request parameters
        switch (view.toLowerCase()) {
            case "basic":
                return ResponseEntity.ok(InventoryItemMapper.toBasicDTO(entity));
            
            case "detailed":
                InventoryItemDetailedDTO detailedDTO = InventoryItemMapper.toDetailedDTO(entity);
                
                // Conditional supplier data inclusion
                if (includeSupplier && entity.getSupplier() != null) {
                    SupplierDTO supplierDTO = SupplierMapper.toDTO(entity.getSupplier());
                    detailedDTO.setSupplier(supplierDTO);
                }
                
                // Conditional history inclusion
                if (includeHistory) {
                    List<StockHistoryDTO> historyDTOs = entity.getStockHistory()
                        .stream()
                        .map(StockHistoryMapper::toDTO)
                        .toList();
                    detailedDTO.setStockHistory(historyDTOs);
                }
                
                return ResponseEntity.ok(detailedDTO);
            
            case "summary":
                return ResponseEntity.ok(InventoryItemMapper.toSummaryDTO(entity));
            
            default:
                return ResponseEntity.badRequest()
                    .body("Invalid view parameter: " + view);
        }
    }
}
```

**Integration Benefits**:
- **Performance**: Only transform required data
- **Flexibility**: Multiple view options for different use cases
- **Bandwidth**: Reduced payload size for mobile/low-bandwidth clients

## Service Layer Boundaries

### Pattern 1: Clean Service-Mapper Separation

**Principle**: Service layer works with entities, mappers handle all transformations.

#### Service Layer Implementation

```java
@Service
@Transactional
@Slf4j
public class InventoryService {
    
    private final InventoryRepository inventoryRepository;
    private final SupplierRepository supplierRepository;
    
    /**
     * Service layer works exclusively with entities.
     * Mappers handle all DTO transformations at controller boundary.
     */
    public InventoryItem createItem(InventoryItem item) {
        log.debug("Creating inventory item: {}", item.getName());
        
        // Business logic validation
        validateInventoryItem(item);
        
        // Supplier resolution if needed
        if (item.getSupplier() != null && item.getSupplier().getId() != null) {
            Supplier supplier = supplierRepository.findById(item.getSupplier().getId())
                .orElseThrow(() -> new SupplierNotFoundException(
                    "Supplier not found: " + item.getSupplier().getId()));
            item.setSupplier(supplier);
        }
        
        // Audit fields
        item.setCreatedAt(LocalDateTime.now());
        item.setCreatedBy(getCurrentUser());
        
        // Persistence
        InventoryItem savedItem = inventoryRepository.save(item);
        
        log.info("Created inventory item with ID: {}", savedItem.getId());
        return savedItem;
    }
    
    /**
     * Service method returns entity - controller handles DTO transformation.
     */
    public InventoryItem findById(Long id) {
        return inventoryRepository.findById(id)
            .orElseThrow(() -> new InventoryItemNotFoundException(
                "Inventory item not found: " + id));
    }
    
    /**
     * Business logic for low stock detection.
     * Returns entities for controller transformation.
     */
    public List<InventoryItem> findLowStockItems() {
        return inventoryRepository.findByQuantityLessThanMinimumQuantity();
    }
    
    /**
     * Complex business operation with entity-only processing.
     */
    @Transactional
    public InventoryItem adjustStock(Long itemId, Integer adjustment, String reason) {
        InventoryItem item = findById(itemId);
        
        // Business validation
        int newQuantity = item.getQuantity() + adjustment;
        if (newQuantity < 0) {
            throw new InsufficientStockException(
                "Insufficient stock. Current: " + item.getQuantity() + 
                ", Adjustment: " + adjustment);
        }
        
        // Create stock history entry
        StockHistory history = new StockHistory();
        history.setInventoryItem(item);
        history.setPreviousQuantity(item.getQuantity());
        history.setNewQuantity(newQuantity);
        history.setChangeType(adjustment > 0 ? ChangeType.ADDITION : ChangeType.REMOVAL);
        history.setReason(reason);
        history.setChangedAt(LocalDateTime.now());
        history.setChangedBy(getCurrentUser());
        
        // Update item
        item.setQuantity(newQuantity);
        item.setUpdatedAt(LocalDateTime.now());
        item.setUpdatedBy(getCurrentUser());
        
        // Save both entities
        InventoryItem savedItem = inventoryRepository.save(item);
        
        log.info("Adjusted stock for item {}: {} -> {}", 
            itemId, history.getPreviousQuantity(), newQuantity);
        
        return savedItem;
    }
    
    private void validateInventoryItem(InventoryItem item) {
        if (item.getQuantity() < 0) {
            throw new ValidationException("Quantity cannot be negative");
        }
        if (item.getPrice() != null && item.getPrice().compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Price cannot be negative");
        }
    }
    
    private String getCurrentUser() {
        // Security context integration
        return SecurityContextHolder.getContext()
            .getAuthentication()
            .getName();
    }
}
```

**Service Layer Benefits**:
- **Clean Boundaries**: Service works only with business entities
- **Testability**: Easy to unit test without DTO concerns
- **Reusability**: Service methods can be used by different API versions
- **Business Focus**: Logic focused on domain concerns, not data transfer

### Pattern 2: Service-Mapper Coordination

**Use Case**: Complex operations requiring coordination between service logic and transformation.

#### Coordinated Service-Mapper Pattern

```java
@Service
public class InventoryAnalyticsService {
    
    private final InventoryRepository inventoryRepository;
    private final StockHistoryRepository stockHistoryRepository;
    
    /**
     * Complex analytics operation with coordinated mapper usage.
     * Service handles entity aggregation, mappers handle transformation.
     */
    public InventoryAnalyticsDTO generateInventoryAnalytics(
            LocalDate startDate, LocalDate endDate) {
        
        // Service handles complex entity queries
        List<InventoryItem> allItems = inventoryRepository.findAll();
        List<StockHistory> periodHistory = stockHistoryRepository
            .findByChangedAtBetween(startDate.atStartOfDay(), endDate.atTime(23, 59, 59));
        
        // Business calculations on entities
        BigDecimal totalValue = allItems.stream()
            .map(this::calculateItemValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        int totalItems = allItems.size();
        int lowStockCount = (int) allItems.stream()
            .filter(item -> item.getQuantity() <= item.getMinimumQuantity())
            .count();
        
        // Service creates analytics entity
        InventoryAnalytics analytics = new InventoryAnalytics();
        analytics.setPeriodStart(startDate);
        analytics.setPeriodEnd(endDate);
        analytics.setTotalValue(totalValue);
        analytics.setTotalItems(totalItems);
        analytics.setLowStockCount(lowStockCount);
        analytics.setGeneratedAt(LocalDateTime.now());
        
        // Transform top items using mapper
        List<InventoryItemSummaryDTO> topItems = allItems.stream()
            .sorted((a, b) -> calculateItemValue(b).compareTo(calculateItemValue(a)))
            .limit(10)
            .map(InventoryItemMapper::toSummaryDTO)
            .toList();
        
        // Transform recent activities using mapper
        List<StockHistoryDTO> recentActivities = periodHistory.stream()
            .sorted((a, b) -> b.getChangedAt().compareTo(a.getChangedAt()))
            .limit(20)
            .map(StockHistoryMapper::toDTO)
            .toList();
        
        // Final DTO transformation with additional data
        InventoryAnalyticsDTO analyticsDTO = InventoryAnalyticsMapper.toDTO(analytics);
        analyticsDTO.setTopValueItems(topItems);
        analyticsDTO.setRecentActivities(recentActivities);
        
        return analyticsDTO;
    }
    
    private BigDecimal calculateItemValue(InventoryItem item) {
        if (item.getPrice() == null || item.getQuantity() == null) {
            return BigDecimal.ZERO;
        }
        return item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
    }
}
```

## REST Endpoint Optimization

### Pattern 1: Efficient Collection Handling

**Performance Focus**: Optimize large collection transformations for REST endpoints.

#### Optimized Collection Endpoints

```java
@RestController
@RequestMapping("/api/v1/inventory")
public class OptimizedInventoryController {
    
    /**
     * High-performance collection endpoint with streaming transformation.
     * 
     * Performance: Stream processing avoids loading entire collection in memory
     * Scalability: Handles large datasets efficiently
     */
    @GetMapping("/export")
    public ResponseEntity<StreamingResponseBody> exportInventory(
            @RequestParam(required = false) String format) {
        
        StreamingResponseBody stream = outputStream -> {
            try (PrintWriter writer = new PrintWriter(outputStream)) {
                
                // Stream entities from repository
                inventoryService.streamAllItems(item -> {
                    // Transform each item using optimized mapper
                    InventoryItemDTO dto = InventoryItemMapper.toDTO(item);
                    
                    // Write to stream based on format
                    if ("csv".equalsIgnoreCase(format)) {
                        writer.println(convertToCSV(dto));
                    } else {
                        writer.println(objectMapper.writeValueAsString(dto));
                    }
                });
            }
        };
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_TYPE, "application/json")
            .body(stream);
    }
    
    /**
     * Batch processing endpoint with mapper optimization.
     * 
     * Performance: Parallel transformation for large batches
     * Memory: Chunked processing to control memory usage
     */
    @PostMapping("/batch")
    public BatchProcessResultDTO processBatch(
            @RequestBody @Valid BatchInventoryRequest request) {
        
        List<InventoryItemDTO> successfulItems = new ArrayList<>();
        List<BatchErrorDTO> errors = new ArrayList<>();
        
        // Process in chunks to control memory usage
        List<CreateInventoryItemRequest> items = request.getItems();
        for (int i = 0; i < items.size(); i += BATCH_CHUNK_SIZE) {
            int endIndex = Math.min(i + BATCH_CHUNK_SIZE, items.size());
            List<CreateInventoryItemRequest> chunk = items.subList(i, endIndex);
            
            // Parallel transformation within chunk
            chunk.parallelStream().forEach(itemRequest -> {
                try {
                    // Transform and process each item
                    InventoryItem entity = InventoryItemMapper.toEntity(itemRequest);
                    InventoryItem savedEntity = inventoryService.createItem(entity);
                    InventoryItemDTO dto = InventoryItemMapper.toDTO(savedEntity);
                    
                    synchronized (successfulItems) {
                        successfulItems.add(dto);
                    }
                } catch (Exception e) {
                    BatchErrorDTO error = new BatchErrorDTO();
                    error.setItemName(itemRequest.getName());
                    error.setError(e.getMessage());
                    
                    synchronized (errors) {
                        errors.add(error);
                    }
                }
            });
        }
        
        return BatchProcessResultDTO.builder()
            .successCount(successfulItems.size())
            .errorCount(errors.size())
            .successfulItems(successfulItems)
            .errors(errors)
            .build();
    }
}
```

### Pattern 2: Conditional Field Loading

**Performance Strategy**: Load and transform only requested fields.

#### Field-Selective REST Endpoints

```java
@RestController
public class SelectiveInventoryController {
    
    /**
     * Field-selective endpoint with conditional mapper usage.
     * 
     * Performance: Transform only requested fields
     * Bandwidth: Reduce response payload size
     */
    @GetMapping("/api/v1/inventory/{id}")
    public ResponseEntity<Map<String, Object>> getInventoryItemSelective(
            @PathVariable Long id,
            @RequestParam(required = false) Set<String> fields) {
        
        InventoryItem entity = inventoryService.findById(id);
        
        // If no fields specified, return full DTO
        if (fields == null || fields.isEmpty()) {
            return ResponseEntity.ok(
                objectMapper.convertValue(
                    InventoryItemMapper.toDTO(entity), 
                    new TypeReference<Map<String, Object>>() {}));
        }
        
        // Selective field transformation
        Map<String, Object> response = new HashMap<>();
        
        // Use mapper utilities for consistent transformation
        if (fields.contains("id")) {
            response.put("id", entity.getId());
        }
        if (fields.contains("name")) {
            response.put("name", entity.getName());
        }
        if (fields.contains("quantity")) {
            response.put("quantity", entity.getQuantity());
        }
        if (fields.contains("price")) {
            response.put("price", entity.getPrice());
        }
        if (fields.contains("totalValue")) {
            // Use mapper's calculation logic
            BigDecimal totalValue = InventoryItemMapper.calculateTotalValue(
                entity.getPrice(), entity.getQuantity());
            response.put("totalValue", totalValue);
        }
        if (fields.contains("supplier") && entity.getSupplier() != null) {
            // Use mapper's transformation logic
            String supplierName = InventoryItemMapper.resolveSupplierName(
                entity.getSupplier());
            response.put("supplierName", supplierName);
        }
        
        return ResponseEntity.ok(response);
    }
}
```

## Request/Response Transformation

### Pattern 1: Request DTO to Entity Mapping

**Focus**: Clean transformation of incoming request data to business entities.

#### Request Transformation Patterns

```java
// Request DTOs designed for optimal mapper integration
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Valid
public class CreateInventoryItemRequest {
    
    @NotBlank(message = "Item name is required")
    @Size(max = 255, message = "Item name cannot exceed 255 characters")
    private String name;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer quantity;
    
    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", message = "Price cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Price format invalid")
    private BigDecimal price;
    
    @Min(value = 0, message = "Minimum quantity cannot be negative")
    private Integer minimumQuantity;
    
    private Long supplierId;  // Reference to existing supplier
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
}

// Mapper extension for request transformation
public final class InventoryItemMapper {
    
    /**
     * Transform create request to entity with validation and defaults.
     * 
     * Validation: Pre-validated request data
     * Defaults: Apply business defaults during transformation
     */
    public static InventoryItem toEntity(CreateInventoryItemRequest request) {
        if (request == null) return null;
        
        InventoryItem entity = new InventoryItem();
        entity.setName(request.getName());
        entity.setQuantity(request.getQuantity());
        entity.setPrice(request.getPrice());
        entity.setDescription(request.getDescription());
        
        // Apply business defaults
        entity.setMinimumQuantity(
            request.getMinimumQuantity() != null 
                ? request.getMinimumQuantity() 
                : DEFAULT_MINIMUM_QUANTITY);
        
        // Supplier reference handling
        if (request.getSupplierId() != null) {
            Supplier supplier = new Supplier();
            supplier.setId(request.getSupplierId());
            entity.setSupplier(supplier);
        }
        
        return entity;
    }
    
    /**
     * Transform update request to entity with selective updates.
     * 
     * Strategy: Only update non-null fields from request
     * Safety: Preserve existing entity data
     */
    public static InventoryItem updateEntity(
            InventoryItem existingEntity, 
            UpdateInventoryItemRequest request) {
        
        if (request == null) return existingEntity;
        
        // Selective updates - only modify provided fields
        if (request.getName() != null) {
            existingEntity.setName(request.getName());
        }
        if (request.getQuantity() != null) {
            existingEntity.setQuantity(request.getQuantity());
        }
        if (request.getPrice() != null) {
            existingEntity.setPrice(request.getPrice());
        }
        if (request.getDescription() != null) {
            existingEntity.setDescription(request.getDescription());
        }
        
        // Update timestamp
        existingEntity.setUpdatedAt(LocalDateTime.now());
        
        return existingEntity;
    }
}
```

### Pattern 2: Response DTO Optimization

**Focus**: Optimize response DTOs for different API consumers.

#### Multi-Level Response DTOs

```java
// Basic response DTO for list operations
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventoryItemSummaryDTO {
    private Long id;
    private String name;
    private Integer quantity;
    private BigDecimal price;
    private String supplierName;
    
    @JsonProperty("isLowStock")
    private Boolean lowStock;
}

// Detailed response DTO for individual item operations
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InventoryItemDetailedDTO {
    private Long id;
    private String name;
    private String description;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal totalValue;
    private Integer minimumQuantity;
    private String supplierName;
    private SupplierDTO supplier;  // Optional detailed supplier info
    private List<StockHistoryDTO> stockHistory;  // Optional history
    
    @JsonProperty("isLowStock")
    private Boolean lowStock;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
    private String createdBy;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
    private String updatedBy;
}

// Mapper extensions for different response levels
public final class InventoryItemMapper {
    
    /**
     * Transform to summary DTO for list operations.
     * 
     * Performance: Minimal field transformation
     * Usage: Collection endpoints, search results
     */
    public static InventoryItemSummaryDTO toSummaryDTO(InventoryItem item) {
        if (item == null) return null;
        
        return InventoryItemSummaryDTO.builder()
            .id(item.getId())
            .name(item.getName())
            .quantity(item.getQuantity())
            .price(item.getPrice())
            .supplierName(resolveSupplierName(item.getSupplier()))
            .lowStock(isLowStock(item))
            .build();
    }
    
    /**
     * Transform to detailed DTO for individual operations.
     * 
     * Performance: Full field transformation with calculations
     * Usage: Individual item endpoints, detailed views
     */
    public static InventoryItemDetailedDTO toDetailedDTO(InventoryItem item) {
        if (item == null) return null;
        
        return InventoryItemDetailedDTO.builder()
            .id(item.getId())
            .name(item.getName())
            .description(item.getDescription())
            .quantity(item.getQuantity())
            .price(item.getPrice())
            .totalValue(calculateTotalValue(item.getPrice(), item.getQuantity()))
            .minimumQuantity(item.getMinimumQuantity())
            .supplierName(resolveSupplierName(item.getSupplier()))
            .lowStock(isLowStock(item))
            .createdAt(item.getCreatedAt())
            .createdBy(item.getCreatedBy())
            .updatedAt(item.getUpdatedAt())
            .updatedBy(item.getUpdatedBy())
            .build();
    }
    
    private static Boolean isLowStock(InventoryItem item) {
        return item.getQuantity() != null && item.getMinimumQuantity() != null
            ? item.getQuantity() <= item.getMinimumQuantity()
            : null;
    }
}
```

## Error Handling Integration

### Pattern 1: Mapper-Aware Exception Handling

**Strategy**: Handle mapper-related errors with appropriate HTTP responses.

#### Global Exception Handler for Mapper Errors

```java
@RestControllerAdvice
@Slf4j
public class MapperExceptionHandler {
    
    /**
     * Handle validation errors from mapper transformations.
     */
    @ExceptionHandler(ValidationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(ValidationException e) {
        log.warn("Validation error during transformation: {}", e.getMessage());
        
        return ErrorResponse.builder()
            .error("VALIDATION_ERROR")
            .message(e.getMessage())
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * Handle transformation errors with detailed field information.
     */
    @ExceptionHandler(TransformationException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public ErrorResponse handleTransformationException(TransformationException e) {
        log.error("Transformation error: {}", e.getMessage(), e);
        
        return ErrorResponse.builder()
            .error("TRANSFORMATION_ERROR")
            .message("Failed to transform data: " + e.getMessage())
            .details(e.getFieldErrors())
            .timestamp(LocalDateTime.now())
            .build();
    }
    
    /**
     * Handle enum transformation errors with valid options.
     */
    @ExceptionHandler(EnumTransformationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleEnumTransformationException(EnumTransformationException e) {
        log.warn("Enum transformation error: {}", e.getMessage());
        
        return ErrorResponse.builder()
            .error("INVALID_ENUM_VALUE")
            .message(e.getMessage())
            .validOptions(e.getValidOptions())
            .timestamp(LocalDateTime.now())
            .build();
    }
}

// Enhanced mapper with detailed error information
public final class StockHistoryMapper {
    
    /**
     * Transform enum with detailed error information.
     */
    public static ChangeType transformChangeType(String changeTypeStr) {
        try {
            return parseEnumSafely(ChangeType.class, changeTypeStr);
        } catch (IllegalArgumentException e) {
            List<String> validOptions = Arrays.stream(ChangeType.values())
                .map(Enum::name)
                .toList();
            
            throw new EnumTransformationException(
                String.format("Invalid change type '%s'. Valid options: %s", 
                    changeTypeStr, validOptions),
                validOptions);
        }
    }
}
```

### Pattern 2: Graceful Degradation

**Strategy**: Handle partial transformation failures gracefully.

#### Resilient Transformation Pattern

```java
@RestController
public class ResilientInventoryController {
    
    /**
     * Batch operation with graceful degradation.
     * 
     * Strategy: Continue processing even if individual items fail
     * Response: Include both successes and failures
     */
    @PostMapping("/api/v1/inventory/batch-with-errors")
    public BatchProcessResultDTO processBatchWithGracefulDegradation(
            @RequestBody BatchInventoryRequest request) {
        
        List<InventoryItemDTO> successfulItems = new ArrayList<>();
        List<BatchErrorDTO> errors = new ArrayList<>();
        
        request.getItems().forEach(itemRequest -> {
            try {
                // Attempt transformation and processing
                InventoryItem entity = InventoryItemMapper.toEntity(itemRequest);
                InventoryItem savedEntity = inventoryService.createItem(entity);
                InventoryItemDTO dto = InventoryItemMapper.toDTO(savedEntity);
                successfulItems.add(dto);
                
            } catch (ValidationException e) {
                // Graceful handling of validation errors
                errors.add(BatchErrorDTO.builder()
                    .itemName(itemRequest.getName())
                    .errorType("VALIDATION_ERROR")
                    .error(e.getMessage())
                    .recoverable(true)
                    .build());
                
            } catch (TransformationException e) {
                // Handle transformation failures
                errors.add(BatchErrorDTO.builder()
                    .itemName(itemRequest.getName())
                    .errorType("TRANSFORMATION_ERROR")
                    .error(e.getMessage())
                    .fieldErrors(e.getFieldErrors())
                    .recoverable(false)
                    .build());
                
            } catch (Exception e) {
                // Handle unexpected errors
                log.error("Unexpected error processing item: {}", itemRequest.getName(), e);
                errors.add(BatchErrorDTO.builder()
                    .itemName(itemRequest.getName())
                    .errorType("SYSTEM_ERROR")
                    .error("Internal processing error")
                    .recoverable(false)
                    .build());
            }
        });
        
        return BatchProcessResultDTO.builder()
            .successCount(successfulItems.size())
            .errorCount(errors.size())
            .successfulItems(successfulItems)
            .errors(errors)
            .partialSuccess(successfulItems.size() > 0 && errors.size() > 0)
            .build();
    }
}
```

## Validation Framework Integration

### Pattern 1: Bean Validation with Mapper Coordination

**Strategy**: Coordinate Bean Validation with mapper transformations.

#### Validation-Aware Controller Pattern

```java
@RestController
@RequestMapping("/api/v1/inventory")
@Validated
public class ValidatedInventoryController {
    
    /**
     * Create endpoint with comprehensive validation.
     * 
     * Validation Flow:
     * 1. Bean validation on request DTO
     * 2. Business validation during transformation
     * 3. Entity validation before persistence
     */
    @PostMapping
    public InventoryItemDTO createInventoryItem(
            @Valid @RequestBody CreateInventoryItemRequest request) {
        
        // Request DTO already validated by @Valid
        
        // Transform with additional business validation
        InventoryItem entity = validateAndTransform(request);
        
        // Service layer validation and processing
        InventoryItem savedEntity = inventoryService.createItem(entity);
        
        // Response transformation
        return InventoryItemMapper.toDTO(savedEntity);
    }
    
    /**
     * Custom validation during transformation.
     */
    private InventoryItem validateAndTransform(CreateInventoryItemRequest request) {
        // Pre-transformation validation
        validateBusinessRules(request);
        
        try {
            return InventoryItemMapper.toEntity(request);
        } catch (Exception e) {
            throw new TransformationException(
                "Failed to transform inventory item", e);
        }
    }
    
    private void validateBusinessRules(CreateInventoryItemRequest request) {
        // Custom business validation logic
        if (request.getPrice().compareTo(BigDecimal.valueOf(1000000)) > 0) {
            throw new ValidationException(
                "Price cannot exceed $1,000,000");
        }
        
        if (request.getQuantity() > 100000) {
            throw new ValidationException(
                "Quantity cannot exceed 100,000 units");
        }
    }
}
```

### Pattern 2: Custom Validation Groups

**Strategy**: Use validation groups for different API scenarios.

#### Validation Group Integration

```java
// Validation groups for different scenarios
public interface CreateValidation {}
public interface UpdateValidation {}
public interface BulkValidation {}

// Request DTO with conditional validation
@Data
@Builder
public class FlexibleInventoryItemRequest {
    
    @NotNull(groups = {CreateValidation.class, UpdateValidation.class})
    @Size(min = 1, max = 255, groups = {CreateValidation.class, UpdateValidation.class})
    private String name;
    
    @NotNull(groups = CreateValidation.class)
    @Min(value = 0, groups = {CreateValidation.class, UpdateValidation.class})
    private Integer quantity;
    
    @NotNull(groups = CreateValidation.class)
    @DecimalMin(value = "0.0", groups = {CreateValidation.class, UpdateValidation.class})
    private BigDecimal price;
    
    // Relaxed validation for bulk operations
    @Size(max = 100, groups = BulkValidation.class)
    private String shortName;
}

// Controller with validation groups
@RestController
public class GroupValidatedController {
    
    @PostMapping("/api/v1/inventory")
    public InventoryItemDTO createItem(
            @Validated(CreateValidation.class) @RequestBody FlexibleInventoryItemRequest request) {
        return processRequest(request);
    }
    
    @PutMapping("/api/v1/inventory/{id}")
    public InventoryItemDTO updateItem(
            @PathVariable Long id,
            @Validated(UpdateValidation.class) @RequestBody FlexibleInventoryItemRequest request) {
        return processUpdateRequest(id, request);
    }
    
    @PostMapping("/api/v1/inventory/bulk")
    public BatchProcessResultDTO bulkCreate(
            @Validated(BulkValidation.class) @RequestBody List<FlexibleInventoryItemRequest> requests) {
        return processBulkRequest(requests);
    }
}
```

## Pagination and Filtering

### Pattern 1: Efficient Page Transformation

**Performance Focus**: Optimize pagination with minimal mapper overhead.

#### High-Performance Pagination

```java
@RestController
@RequestMapping("/api/v1/inventory")
public class PaginatedInventoryController {
    
    /**
     * High-performance paginated endpoint.
     * 
     * Performance: Stream-based transformation avoids loading all data
     * Memory: Page-level processing controls memory usage
     */
    @GetMapping
    public Page<InventoryItemSummaryDTO> getInventoryItems(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly) {
        
        // Build sort specification
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        
        // Create pageable
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Service returns paginated entities with filtering
        Page<InventoryItem> entityPage = inventoryService.findWithFilters(
            pageable, search, lowStockOnly);
        
        // Efficient page transformation using method reference
        return entityPage.map(InventoryItemMapper::toSummaryDTO);
    }
    
    /**
     * Advanced filtering with dynamic criteria.
     * 
     * Performance: Database-level filtering before transformation
     * Flexibility: Dynamic query building based on provided filters
     */
    @PostMapping("/search")
    public Page<InventoryItemDetailedDTO> searchInventoryItems(
            @RequestBody InventorySearchCriteria criteria,
            @PageableDefault(size = 20) Pageable pageable) {
        
        // Service handles complex filtering at database level
        Page<InventoryItem> entityPage = inventoryService.searchWithCriteria(criteria, pageable);
        
        // Transform results based on requested detail level
        if (criteria.isDetailedView()) {
            return entityPage.map(InventoryItemMapper::toDetailedDTO);
        } else {
            return entityPage.map(InventoryItemMapper::toSummaryDTO)
                .map(this::convertSummaryToDetailed);  // Convert if needed
        }
    }
    
    private InventoryItemDetailedDTO convertSummaryToDetailed(InventoryItemSummaryDTO summary) {
        // Efficient conversion when detailed view is needed
        return InventoryItemDetailedDTO.builder()
            .id(summary.getId())
            .name(summary.getName())
            .quantity(summary.getQuantity())
            .price(summary.getPrice())
            .supplierName(summary.getSupplierName())
            .lowStock(summary.getLowStock())
            .build();
    }
}
```

### Pattern 2: Cursor-Based Pagination

**Use Case**: High-performance pagination for large datasets.

#### Cursor Pagination Implementation

```java
@RestController
public class CursorPaginatedController {
    
    /**
     * Cursor-based pagination for high-performance scrolling.
     * 
     * Performance: O(log n) database queries regardless of offset
     * Consistency: Stable pagination even with data changes
     */
    @GetMapping("/api/v1/inventory/cursor")
    public CursorPageResponse<InventoryItemDTO> getInventoryItemsCursor(
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int limit) {
        
        // Service handles cursor-based queries
        CursorPage<InventoryItem> entityPage = inventoryService.findWithCursor(cursor, limit);
        
        // Transform entities to DTOs
        List<InventoryItemDTO> dtos = entityPage.getContent()
            .stream()
            .map(InventoryItemMapper::toDTO)
            .toList();
        
        return CursorPageResponse.<InventoryItemDTO>builder()
            .content(dtos)
            .nextCursor(entityPage.getNextCursor())
            .hasNext(entityPage.hasNext())
            .size(dtos.size())
            .build();
    }
}
```

## API Documentation Integration

### Pattern 1: OpenAPI Schema Generation

**Focus**: Generate accurate API documentation from mapper-driven endpoints.

#### OpenAPI Integration Examples

```java
@RestController
@RequestMapping("/api/v1/inventory")
@Tag(name = "Inventory Management", description = "Inventory item operations")
public class DocumentedInventoryController {
    
    @Operation(
        summary = "Create new inventory item",
        description = "Creates a new inventory item with validation and automatic calculations"
    )
    @ApiResponses({
        @ApiResponse(
            responseCode = "201",
            description = "Inventory item created successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = InventoryItemDTO.class)
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Invalid request data",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ErrorResponse.class)
            )
        )
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryItemDTO createInventoryItem(
            @Parameter(description = "Inventory item creation request")
            @Valid @RequestBody CreateInventoryItemRequest request) {
        
        InventoryItem entity = InventoryItemMapper.toEntity(request);
        InventoryItem savedEntity = inventoryService.createItem(entity);
        return InventoryItemMapper.toDTO(savedEntity);
    }
    
    @Operation(
        summary = "Get inventory items with pagination",
        description = "Retrieves paginated list of inventory items with optional filtering"
    )
    @GetMapping
    public Page<InventoryItemSummaryDTO> getInventoryItems(
            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "20") int size,
            
            @Parameter(description = "Search term for name or description")
            @RequestParam(required = false) String search) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<InventoryItem> entityPage = inventoryService.findAll(pageable, search);
        return entityPage.map(InventoryItemMapper::toSummaryDTO);
    }
}
```

### Pattern 2: Schema Documentation

**Strategy**: Document DTO schemas with mapper transformation details.

#### Enhanced DTO Documentation

```java
@Schema(
    description = "Inventory item data transfer object with calculated fields",
    example = """
        {
            "id": 1,
            "name": "Widget A",
            "quantity": 100,
            "price": 25.99,
            "totalValue": 2599.00,
            "supplierName": "ACME Corp",
            "lowStock": false
        }
        """
)
@Data
@Builder
public class InventoryItemDTO {
    
    @Schema(
        description = "Unique identifier for the inventory item",
        example = "1",
        accessMode = Schema.AccessMode.READ_ONLY
    )
    private Long id;
    
    @Schema(
        description = "Name of the inventory item",
        example = "Widget A",
        maxLength = 255
    )
    private String name;
    
    @Schema(
        description = "Current quantity in stock",
        example = "100",
        minimum = "0"
    )
    private Integer quantity;
    
    @Schema(
        description = "Unit price of the item",
        example = "25.99",
        minimum = "0.01"
    )
    private BigDecimal price;
    
    @Schema(
        description = "Calculated total value (price × quantity)",
        example = "2599.00",
        accessMode = Schema.AccessMode.READ_ONLY
    )
    private BigDecimal totalValue;
    
    @Schema(
        description = "Name of the supplier (resolved from supplier relationship)",
        example = "ACME Corp",
        accessMode = Schema.AccessMode.READ_ONLY
    )
    private String supplierName;
    
    @Schema(
        description = "Indicates if item is below minimum stock level",
        example = "false",
        accessMode = Schema.AccessMode.READ_ONLY
    )
    @JsonProperty("isLowStock")
    private Boolean lowStock;
}
```

## Performance Monitoring Integration

### Pattern 1: Mapper Performance Metrics

**Strategy**: Monitor mapper performance with detailed metrics.

#### Metrics Integration

```java
@Component
@Slf4j
public class MapperPerformanceMonitor {
    
    private final MeterRegistry meterRegistry;
    private final Counter transformationCounter;
    private final Timer transformationTimer;
    
    public MapperPerformanceMonitor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.transformationCounter = Counter.builder("mapper.transformations.total")
            .description("Total number of mapper transformations")
            .register(meterRegistry);
        this.transformationTimer = Timer.builder("mapper.transformation.duration")
            .description("Duration of mapper transformations")
            .register(meterRegistry);
    }
    
    /**
     * Monitor mapper performance with detailed metrics.
     */
    public <T> T monitorTransformation(String operation, Supplier<T> transformation) {
        Timer.Sample sample = Timer.start(meterRegistry);
        
        try {
            T result = transformation.get();
            transformationCounter.increment(Tags.of("operation", operation, "status", "success"));
            return result;
            
        } catch (Exception e) {
            transformationCounter.increment(Tags.of("operation", operation, "status", "error"));
            log.error("Mapper transformation failed for operation: {}", operation, e);
            throw e;
            
        } finally {
            sample.stop(Timer.builder("mapper.transformation.duration")
                .tag("operation", operation)
                .register(meterRegistry));
        }
    }
}

// Enhanced mapper with performance monitoring
public final class MonitoredInventoryItemMapper {
    
    private static MapperPerformanceMonitor monitor;
    
    public static void setPerformanceMonitor(MapperPerformanceMonitor monitor) {
        MonitoredInventoryItemMapper.monitor = monitor;
    }
    
    public static InventoryItemDTO toDTO(InventoryItem item) {
        if (monitor != null) {
            return monitor.monitorTransformation("inventory.toDTO", 
                () -> InventoryItemMapper.toDTO(item));
        }
        return InventoryItemMapper.toDTO(item);
    }
    
    public static InventoryItem toEntity(CreateInventoryItemRequest request) {
        if (monitor != null) {
            return monitor.monitorTransformation("inventory.toEntity", 
                () -> InventoryItemMapper.toEntity(request));
        }
        return InventoryItemMapper.toEntity(request);
    }
}
```

### Pattern 2: Application Performance Monitoring

**Strategy**: Integrate with APM tools for production monitoring.

#### APM Integration Example

```java
@RestController
@Slf4j
public class MonitoredInventoryController {
    
    @Autowired
    private Tracer tracer;  // Distributed tracing
    
    /**
     * Endpoint with comprehensive APM integration.
     */
    @GetMapping("/api/v1/inventory/{id}")
    @Traced(operationName = "get-inventory-item")  // Custom tracing
    public InventoryItemDTO getInventoryItem(@PathVariable Long id) {
        
        Span span = tracer.nextSpan()
            .name("inventory-transformation")
            .tag("item.id", String.valueOf(id))
            .start();
        
        try (Tracer.SpanInScope ws = tracer.withSpanInScope(span)) {
            // Service call with tracing
            InventoryItem entity = inventoryService.findById(id);
            span.tag("item.name", entity.getName());
            
            // Mapper transformation with tracing
            span.event("mapper-transformation-start");
            InventoryItemDTO dto = InventoryItemMapper.toDTO(entity);
            span.event("mapper-transformation-complete");
            
            return dto;
            
        } catch (Exception e) {
            span.tag("error", e.getMessage());
            throw e;
        } finally {
            span.end();
        }
    }
}
```

---

## API Integration Summary

The comprehensive API integration patterns provide:

1. **Clean Architecture**: Clear boundaries between controllers, services, and mappers
2. **Performance Optimization**: Efficient transformation patterns for high-throughput operations
3. **Error Handling**: Robust error management with graceful degradation
4. **Validation Integration**: Coordinated validation across layers
5. **Monitoring**: Comprehensive performance and tracing integration

These patterns ensure the mapper layer integrates seamlessly with the REST API layer while maintaining optimal performance and clean separation of concerns.

---

*This guide provides comprehensive patterns for integrating optimized entity-DTO mappers with REST API endpoints in enterprise Spring Boot applications.*