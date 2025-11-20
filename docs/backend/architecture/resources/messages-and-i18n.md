[⬅️ Back to Resources Index](./index.html)

# Messages & Internationalization (i18n)

**Overview:** This document explains how messages, validation errors, and internationalization are configured in Smart Supply Pro.

---

## Table of Contents

1. [Message Properties Overview](#message-properties-overview)
2. [Supported Languages](#supported-languages)
3. [Validation Messages](#validation-messages)
4. [Error Codes & Messages](#error-codes--messages)
5. [Internationalization Strategy](#internationalization-strategy)
6. [Frontend Integration](#frontend-integration)

---

## Message Properties Overview

### Purpose

Message properties files centralize text content used throughout the application:
- Validation error messages
- Error response messages
- Business exception descriptions
- User-facing error codes

### Current Implementation Status

**Status:** Infrastructure prepared, implementation ongoing

```
src/main/resources/
├── messages.properties          # Default/English messages
├── messages_de.properties       # German messages
└── (more languages as needed)
```

**What's Externalized:**
- ✅ Validation constraint messages (JSR-380)
- ✅ Custom validator error messages
- ✅ GlobalExceptionHandler response messages
- ✅ Error codes for frontend error handling

### Why Externalize Messages?

**Without externalization (bad):**
```java
if (item.getQuantity() < 0) {
    throw new InvalidParameterException("Quantity cannot be negative");
}

// Problem: Message hardcoded; can't translate; difficult to maintain
```

**With externalization (good):**
```java
if (item.getQuantity() < 0) {
    throw new InvalidParameterException(messageSource.getMessage(
        "inventory.item.quantity.negative", null, locale));
}

// Message stored in: messages.properties (EN), messages_de.properties (DE)
// Automatically returns correct translation based on locale
```

---

## Supported Languages

### Language Configuration

| Language | File | Locale Code | Status |
|----------|------|---|---|
| **English** | `messages.properties` | `en` | ✅ Base language |
| **German** | `messages_de.properties` | `de` | ✅ Supported |

### How Locale is Determined

**Server-side (HTTP requests):**
```
Spring checks (in order):
  1. URL parameter: ?lang=de
  2. Cookie: SPRING_LOCALE
  3. Accept-Language header: Accept-Language: de-DE
  4. Server default (locale.setDefaultLocale())
```

**Example:**
```bash
# Request with German locale
curl "http://localhost:8081/api/suppliers?lang=de"
# Response messages will be in German

# Using Accept-Language header
curl -H "Accept-Language: de-DE" http://localhost:8081/api/suppliers
# Response messages will be in German
```

**Client-side (Frontend React):**
```typescript
// Frontend controls locale independently
const [locale, setLocale] = useState('en');  // or 'de'

// Frontend sends request with locale
const response = await fetch('/api/suppliers?lang=' + locale);
```

---

## Validation Messages

### JSR-380 Annotation Messages

Validation constraints can specify message keys:

```java
public class InventoryItemDTO {
    @NotBlank(message = "{inventory.item.name.required}")
    private String name;

    @Min(value = 0, message = "{inventory.item.quantity.min}")
    private Integer quantity;

    @Email(message = "{inventory.supplier.email.invalid}")
    private String supplierEmail;
}
```

### Message Properties Files

**messages.properties (English):**
```properties
# Inventory Item Validation
inventory.item.name.required=Item name is required
inventory.item.name.too.long=Item name cannot exceed 255 characters
inventory.item.quantity.min=Quantity must be at least 0
inventory.item.quantity.max=Quantity cannot exceed 999999
inventory.item.price.min=Price must be greater than 0
inventory.item.price.precision=Price can have at most 2 decimal places

# Supplier Validation
inventory.supplier.email.invalid=Invalid email address
inventory.supplier.name.required=Supplier name is required
```

**messages_de.properties (German):**
```properties
# Lagerverwaltung Validierung
inventory.item.name.required=Artikelname ist erforderlich
inventory.item.name.too.long=Artikelname darf 255 Zeichen nicht überschreiten
inventory.item.quantity.min=Menge muss mindestens 0 sein
inventory.item.quantity.max=Menge darf 999999 nicht überschreiten
inventory.item.price.min=Preis muss größer als 0 sein
inventory.item.price.precision=Preis darf höchstens 2 Dezimalstellen haben

# Lieferant Validierung
inventory.supplier.email.invalid=Ungültige E-Mail-Adresse
inventory.supplier.name.required=Lieferantenname ist erforderlich
```

### Custom Validator Messages

```java
// Custom validator class
@Component
public class InventoryItemValidator {
    private final MessageSource messageSource;

    public InventoryItemValidator(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public void validateInventoryItemNotExists(String name, BigDecimal price, Locale locale) {
        if (inventoryItemRepository.findByNameIgnoreCase(name).isPresent()) {
            String message = messageSource.getMessage(
                "inventory.item.duplicate",  // Key from properties
                null,                        // Arguments (if parameterized)
                locale                       // Locale
            );
            throw new DuplicateResourceException(message);
        }
    }
}
```

**messages.properties:**
```properties
inventory.item.duplicate=An inventory item with this name already exists
```

**messages_de.properties:**
```properties
inventory.item.duplicate=Ein Artikel mit diesem Namen existiert bereits
```

---

## Error Codes & Messages

### Exception Response Structure

**GlobalExceptionHandler returns:**
```json
{
  "error": "DUPLICATE_RESOURCE",
  "message": "An inventory item with this name already exists",
  "timestamp": "2024-11-20T14:30:00Z",
  "path": "/api/suppliers",
  "status": 409
}
```

### Error Code Mapping

**messages.properties:**
```properties
# Error codes and descriptions
error.duplicate.resource=An inventory item with this name already exists
error.not.found.supplier=Supplier not found
error.invalid.parameter=Invalid parameter provided
error.unauthorized=You are not authorized to perform this action
error.forbidden=Access to this resource is forbidden
error.internal.server.error=An unexpected error occurred
```

**messages_de.properties:**
```properties
error.duplicate.resource=Ein Artikel mit diesem Namen existiert bereits
error.not.found.supplier=Lieferant nicht gefunden
error.invalid.parameter=Ungültiger Parameter angegeben
error.unauthorized=Sie sind nicht berechtigt, diese Aktion durchzuführen
error.forbidden=Zugriff auf diese Ressource ist nicht gestattet
error.internal.server.error=Ein unerwarteter Fehler ist aufgetreten
```

### Usage in Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    private final MessageSource messageSource;

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(
            DuplicateResourceException ex,
            HttpServletRequest request,
            Locale locale) {
        
        String message = messageSource.getMessage(
            "error.duplicate.resource",
            null,
            locale
        );
        
        return ResponseEntity.status(409).body(
            new ErrorResponse(
                "DUPLICATE_RESOURCE",
                message,
                LocalDateTime.now(),
                request.getRequestURI(),
                409
            )
        );
    }
}
```

---

## Internationalization Strategy

### Message Key Naming Convention

**Pattern:** `{domain}.{entity}.{aspect}.{detail}`

**Examples:**
```
inventory.item.name.required
├── domain: inventory (application domain)
├── entity: item (what entity)
├── aspect: name (which field or concern)
└── detail: required (specific message)

inventory.supplier.email.invalid
└── validation error for supplier email

error.not.found.supplier
├── domain: error (error message)
├── aspect: not (what happened)
└── detail: found (what)
```

### Message File Organization

**Flat structure (current):**
```
messages.properties
├── inventory.item.*
├── inventory.supplier.*
├── error.*
└── (all messages in one file)
```

**Alternative hierarchical (for larger apps):**
```
messages/
├── inventory/
│   ├── item.properties
│   └── supplier.properties
├── error/
│   └── messages.properties
└── common.properties
```

### Adding New Languages

**To add French (fr):**

1. Create file:
```bash
touch src/main/resources/messages_fr.properties
```

2. Add translations:
```properties
# messages_fr.properties
inventory.item.name.required=Le nom de l'article est requis
inventory.item.quantity.min=La quantité doit être au moins 0
```

3. Clients can use:
```bash
curl "http://localhost:8081/api/suppliers?lang=fr"
```

---

## Frontend Integration

### Fetching Messages from Backend

**Option 1: Get all messages at once**

```typescript
// frontend/src/services/i18n.ts
export async function fetchMessages(locale: string) {
  const response = await fetch(`/api/messages?lang=${locale}`);
  return response.json();
  // Returns: { "inventory.item.name.required": "Item name is required", ... }
}
```

**Backend endpoint (if implemented):**
```java
@GetMapping("/api/messages")
public Map<String, String> getMessages(@RequestParam String lang) {
    Locale locale = new Locale(lang);
    // Return all messages for locale
    return messageService.getAllMessages(locale);
}
```

**Option 2: Include messages in error response**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "validation.inventory.item.quantity.min",
  "localizedMessage": "Quantity must be at least 0",
  "status": 400
}
```

**Frontend reads:**
```typescript
const error = response.data;
// Display: error.localizedMessage
// Or: fetch translation using error.message key
```

### Frontend Localization Example

**React component with i18n:**

```typescript
// frontend/src/i18n/messages.ts
const messages = {
  en: {
    'inventory.item.name.required': 'Item name is required',
    'inventory.item.quantity.min': 'Quantity must be at least 0',
    'error.duplicate.resource': 'An item with this name already exists',
  },
  de: {
    'inventory.item.name.required': 'Artikelname ist erforderlich',
    'inventory.item.quantity.min': 'Menge muss mindestens 0 sein',
    'error.duplicate.resource': 'Ein Artikel mit diesem Namen existiert bereits',
  }
};

// Component usage
function useMessage(key: string, locale: string = 'en') {
  return messages[locale]?.[key] || key;
}

// In component
export function SupplierForm() {
  const [locale, setLocale] = useState('en');
  
  return (
    <div>
      <label>{useMessage('inventory.item.name.required', locale)}</label>
      <input type="text" placeholder="Enter item name" />
    </div>
  );
}
```

### Alternatively: Use Frontend i18n Library

**Popular options:**
- **i18next** - Most popular, mature
- **React Intl** - Format dates, numbers, pluralization
- **Format.js** - Lightweight, small bundle

**Example with i18next:**
```typescript
import i18n from 'i18next';

i18n.init({
  resources: {
    en: {
      translation: {
        'inventory.item.name': 'Item Name',
        'inventory.item.quantity': 'Quantity'
      }
    },
    de: {
      translation: {
        'inventory.item.name': 'Artikelname',
        'inventory.item.quantity': 'Menge'
      }
    }
  }
});

// In React component
<h1>{t('inventory.item.name')}</h1>
```

---

## Current Status & Next Steps

### Currently Implemented

✅ Message properties files created
✅ Validation message keys defined
✅ Error code messages externalized
✅ German translations available

### Next Steps (Future Enhancement)

- [ ] Create `/api/messages` endpoint to fetch all messages
- [ ] Integrate with frontend i18n library
- [ ] Add message caching for performance
- [ ] Add more languages (French, Spanish, etc.)
- [ ] Document frontend translation strategy
- [ ] Add pluralization rules per language
- [ ] Add date/number formatting by locale

---

## Best Practices

### 1. Always Externalize User-Facing Messages

**❌ Bad:**
```java
throw new InvalidParameterException("Quantity must be positive");
```

**✅ Good:**
```java
String message = messageSource.getMessage("inventory.item.quantity.positive", null, locale);
throw new InvalidParameterException(message);
```

### 2. Use Consistent Key Naming

**❌ Bad:**
```properties
item_name_error=Item name is required
ItemNameRequired=Item name is required
nameRequired=Item name is required
```

**✅ Good:**
```properties
inventory.item.name.required=Item name is required
```

### 3. Keep Message Files Small & Organized

**❌ Bad:** 1000+ messages in single file

**✅ Good:** Group by domain/entity
```
messages.properties       (base English)
messages_de.properties    (German translation)
messages_fr.properties    (French translation, if added)
```

### 4. Provide Context in Messages

**❌ Bad:**
```properties
error=An error occurred
```

**✅ Good:**
```properties
error.duplicate.resource=An inventory item with this name already exists
error.not.found.supplier=Supplier with ID {0} not found
```

### 5. Parameterize Messages When Needed

**❌ Bad:** Create separate messages for each ID/name
```properties
supplier.not.found.1=Supplier with ID 1 not found
supplier.not.found.2=Supplier with ID 2 not found
```

**✅ Good:** Use parameterized message
```properties
supplier.not.found=Supplier with ID {0} not found

// Usage
messageSource.getMessage("supplier.not.found", new Object[]{supplierId}, locale)
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **File Format** | Java `.properties` (key=value format) |
| **Base Language** | English (`messages.properties`) |
| **Supported Languages** | English, German (more can be added) |
| **Location** | `src/main/resources/` |
| **Framework** | Spring's `MessageSource` |
| **Usage** | Validation messages, error responses, user-facing text |
| **Frontend Integration** | React can fetch and display localized messages |

---

[⬅️ Back to Resources Index](./index.html)
