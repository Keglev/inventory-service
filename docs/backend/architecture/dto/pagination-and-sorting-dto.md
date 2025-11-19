[⬅️ Back to DTO Hub](./index.md)

# Pagination & Sorting DTOs

## Overview

Pagination is **not a separate DTO class** but a standard response structure from Spring Data's `Page<T>` interface. All list endpoints return this format with metadata and content.

---

## Page<T> Response Structure

Spring Data automatically wraps list responses in pagination metadata:

```json
{
  "content": [ /* Array of DTOs */ ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": [ { "property": "name", "direction": "ASC" } ]
  },
  "totalElements": 1250,
  "totalPages": 63,
  "last": false,
  "first": true,
  "number": 0,
  "size": 20,
  "numberOfElements": 20,
  "empty": false
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `content` | Array | List of DTOs for current page |
| `pageable.pageNumber` | Integer | Current page (0-indexed) |
| `pageable.pageSize` | Integer | Items per page |
| `pageable.sort` | Array | Active sort criteria |
| `totalElements` | Long | Total count across all pages |
| `totalPages` | Integer | Number of pages |
| `last` | Boolean | True if this is the last page |
| `first` | Boolean | True if this is the first page |
| `number` | Integer | Current page number (0-indexed) |
| `size` | Integer | Items per page |
| `numberOfElements` | Integer | Items in current page |
| `empty` | Boolean | True if content is empty |

---

## Query Parameters

### Pagination Parameters

| Parameter | Type | Default | Max | Example |
|-----------|------|---------|-----|---------|
| `page` | Integer | 0 | — | `?page=2` |
| `size` | Integer | 20 | 200 | `?size=50` |

**Rules:**
- Page is **0-indexed** (first page = 0)
- Size must be **> 0** and **<= 200**
- Default page size is **20**

### Sorting Parameters

| Parameter | Format | Example |
|-----------|--------|---------|
| `sort` | `property,direction` | `?sort=name,asc` |
| Multiple | Comma-separated | `?sort=name,asc&sort=createdAt,desc` |

**Directions:**
- `asc` – Ascending order (A→Z, 0→9)
- `desc` – Descending order (Z→A, 9→0)

---

## Sorting by Field

### Supplier Endpoints

**Sortable fields:**
- `name` – Supplier name (default)
- `createdAt` – Creation timestamp
- `email` – Email address

**Example:**

```http
GET /api/suppliers?page=0&size=20&sort=name,asc&sort=createdAt,desc
```

**Response:**
1. First sort by `name` (ascending: A→Z)
2. Then by `createdAt` (descending: newest first)

### Inventory Item Endpoints

**Sortable fields:**
- `name` – Item name
- `price` – Unit price
- `quantity` – Stock quantity
- `totalValue` – quantity × price
- `createdAt` – Creation timestamp

**Example:**

```http
GET /api/items?size=50&sort=price,desc
```

Returns highest-priced items first.

### Stock History Endpoints

**Sortable fields:**
- `timestamp` – Change timestamp (default, descending)
- `change` – Quantity delta
- `createdBy` – User who made change

**Example (default sort):**

```http
GET /api/stock-history
```

Automatically sorts by `timestamp DESC` (most recent first).

---

## Request/Response Examples

### Default Pagination (Page 0, Size 20)

**Request:**

```http
GET /api/suppliers
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "content": [
    { "id": "SUP-001", "name": "ACME Corp", ... },
    { "id": "SUP-002", "name": "Global Supplies", ... },
    /* ... 18 more items ... */
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 20,
    "sort": [ { "property": "name", "direction": "ASC" } ]
  },
  "totalElements": 42,
  "totalPages": 3,
  "last": false,
  "first": true,
  "number": 0,
  "size": 20,
  "numberOfElements": 20,
  "empty": false
}
```

### Custom Page Size (Size 50)

**Request:**

```http
GET /api/suppliers?size=50
Authorization: Bearer <token>
```

**Response:**
- `totalElements`: 42 (unchanged)
- `totalPages`: 1 (all fit on one page)
- `numberOfElements`: 42 (all on current page)
- `last`: true (this is the last page)

### Pagination Navigation (Page 1)

**Request:**

```http
GET /api/suppliers?page=1&size=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "content": [
    /* Items 20-39 (2nd page) */
  ],
  "pageable": { "pageNumber": 1, "pageSize": 20, ... },
  "totalElements": 42,
  "totalPages": 3,
  "last": false,
  "first": false,
  "number": 1,
  "numberOfElements": 20,
  "empty": false
}
```

### Sorted by Price (Descending)

**Request:**

```http
GET /api/items?sort=price,desc&size=25
Authorization: Bearer <token>
```

**Response:**
```json
{
  "content": [
    { "id": "ITEM-999", "name": "Premium Item", "price": 299.99, ... },
    { "id": "ITEM-888", "name": "High-End Item", "price": 199.99, ... },
    /* ... sorted by price, highest first ... */
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 25,
    "sort": [ { "property": "price", "direction": "DESC" } ]
  },
  "totalElements": 1250,
  "totalPages": 50,
  "numberOfElements": 25
}
```

### Multiple Sort Criteria

**Request:**

```http
GET /api/items?sort=supplierId,asc&sort=name,asc
Authorization: Bearer <token>
```

**Response:**
```json
{
  "pageable": {
    "sort": [
      { "property": "supplierId", "direction": "ASC" },
      { "property": "name", "direction": "ASC" }
    ]
  },
  /* ... */
}
```

Groups by supplier, then sorts by name within each supplier.

---

## Client Implementation

### Using Pagination in JavaScript

```javascript
async function fetchSuppliers(page = 0, size = 20, sortBy = 'name') {
  const params = new URLSearchParams({
    page,
    size,
    sort: `${sortBy},asc`
  });

  const response = await fetch(`/api/suppliers?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  console.log(`Page ${data.number + 1} of ${data.totalPages}`);
  console.log(`Total items: ${data.totalElements}`);
  console.log(`Items on this page: ${data.numberOfElements}`);
  
  return data.content;  // Array of DTO objects
}

// Fetch page 1 (second page), 50 items per page
const suppliers = await fetchSuppliers(1, 50);
```

### Using Pagination in Java (RestTemplate)

```java
RestTemplate restTemplate = new RestTemplate();

// Build URL with pagination
String url = "http://localhost:8080/api/suppliers?" +
    "page=0&size=20&sort=name,asc";

ResponseEntity<PagedModel<SupplierDTO>> response = restTemplate.exchange(
    url,
    HttpMethod.GET,
    new HttpEntity<>(headers),
    new ParameterizedTypeReference<PagedModel<SupplierDTO>>() {}
);

Page<SupplierDTO> page = response.getBody();
System.out.println("Total: " + page.getTotalElements());
System.out.println("Pages: " + page.getTotalPages());
System.out.println("Items on this page: " + page.getContent().size());
```

---

## Pagination Limits

### Page Size Constraints

```
Minimum size:  1
Default size:  20
Maximum size:  200
```

**Request with size > 200:**

```http
GET /api/suppliers?size=500
```

**Response (400 Bad Request):**

```json
{
  "error": "bad_request",
  "message": "Page size must be between 1 and 200",
  "timestamp": "2025-11-19T10:35:00.000Z",
  "correlationId": "SSP-1700123456789-4523"
}
```

### Invalid Page Number

```http
GET /api/suppliers?page=999
```

**Response (200 OK, empty content):**

```json
{
  "content": [],
  "pageable": { "pageNumber": 999, "pageSize": 20, ... },
  "totalElements": 42,
  "totalPages": 3,
  "last": false,
  "first": false,
  "numberOfElements": 0,
  "empty": true
}
```

---

## Performance Optimization

### Tip 1: Use Reasonable Page Sizes

```
❌ size=1      (Too small, many requests needed)
✅ size=20     (Default, balanced)
✅ size=100    (For bulk operations)
❌ size=10000  (Too large, slow queries)
```

### Tip 2: Sort Only on Indexed Fields

**Good performance:**
```http
?sort=name,asc           (indexed column)
?sort=createdAt,desc     (indexed column)
```

**Poor performance:**
```http
?sort=description,asc    (large text, no index)
?sort=computedField,asc  (calculated, not stored)
```

### Tip 3: Pagination is Better Than Offset

Spring Data's pagination uses LIMIT/OFFSET which can be slow on large tables. For very large datasets, consider:

```
LIMIT 20 OFFSET 0      ✅ Fast (small offset)
LIMIT 20 OFFSET 100000 ❌ Slow (large offset scans)
```

For cursor-based pagination, see analytics endpoints which may support `startKey` parameters.

---

## Testing Pagination

### Unit Test Template

```java
@WebMvcTest(SupplierController.class)
class SupplierControllerPaginationTest {

    @MockBean
    private SupplierService supplierService;

    @Test
    void testList_WithPaginationParams_ReturnPagedResponse() throws Exception {
        List<SupplierDTO> suppliers = List.of(
            new SupplierDTO("SUP-001", "ACME", ...),
            new SupplierDTO("SUP-002", "Global", ...)
        );

        Page<SupplierDTO> page = new PageImpl<>(
            suppliers,
            PageRequest.of(0, 20),
            42  // totalElements
        );

        when(supplierService.findAll(any(Pageable.class)))
            .thenReturn(page);

        mockMvc.perform(get("/api/suppliers?page=0&size=20"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content", hasSize(2)))
            .andExpect(jsonPath("$.totalElements").value(42))
            .andExpect(jsonPath("$.totalPages").value(3))
            .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    void testList_WithCustomSort_ReturnsSorted() throws Exception {
        /* Mock and test with sort=price,desc */
    }
}
```

---

## Summary

| Aspect | Detail |
|--------|--------|
| **Structure** | Spring's `Page<T>` with metadata |
| **Default Size** | 20 items |
| **Max Size** | 200 items |
| **Default Sort** | By endpoint (often by name or timestamp) |
| **Pagination Param** | `page` (0-indexed) |
| **Size Param** | `size` (1-200) |
| **Sort Param** | `sort=property,direction` (supports multiple) |
| **Response Fields** | content, pageable, totalElements, totalPages, last, first, etc. |

---

[⬅️ Back to DTO Hub](./index.md)
