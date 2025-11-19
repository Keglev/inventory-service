[⬅️ Back to Model Index](./index.md)

# Supplier Entity

**Purpose:** Represents inventory goods providers

**Database Table:** `SUPPLIER`

## Entity Definition

```java
@Entity
@Table(name = "SUPPLIER")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Supplier {
    
    @Id
    @Column(name = "ID", nullable = false)
    private String id;  // UUID or custom ID
    
    @Column(name = "NAME", nullable = false, unique = true)
    private String name;  // Unique supplier name
    
    @Column(name = "CONTACT_NAME")
    private String contactName;  // Contact person
    
    @Column(name = "PHONE")
    private String phone;  // Phone number
    
    @Column(name = "EMAIL")
    private String email;  // Email address
    
    @Column(name = "CREATED_BY", nullable = false)
    private String createdBy;  // User who created
    
    @CreationTimestamp
    @Column(name = "CREATED_AT", nullable = false, updatable = false)
    private LocalDateTime createdAt;  // When created (immutable)
}
```

## Business Rules

1. **Unique Name:** Supplier name must be unique across the system
2. **No Cascading Deletion:** Supplier cannot be deleted if linked to active inventory items
3. **Read-Heavy:** Supplier information is mostly immutable (frequently accessed, rarely changed)
4. **Audit Tracking:** Tracks creator and creation timestamp for compliance
5. **Contact Information:** Phone and email are optional but recommended

## Key Relationships

- **One-to-Many with InventoryItem:** One supplier can provide many inventory items
- **One-to-Many with StockHistory:** One supplier can have multiple stock history entries (via inventory items)

---

[⬅️ Back to Model Index](./index.md)
