[⬅️ Back to Resources Index](./index.html)

# Static Resources & Templates

**Overview:** This document explains the static resources and template handling in Smart Supply Pro.

---

## Table of Contents

1. [Architecture: API-Only Backend](#architecture-api-only-backend)
2. [Directory Structure](#directory-structure)
3. [Frontend Location](#frontend-location)
4. [Why No Backend Templates](#why-no-backend-templates)

---

## Architecture: API-Only Backend

### Backend Design

Smart Supply Pro backend is a **pure REST API**:

```
Clients (Browser, Mobile, Desktop)
    ↓
HTTP REST Requests
    ↓
Spring Boot API
    ↓
Returns JSON responses (not HTML)
```

### Key Characteristics

✅ **Returns JSON, not HTML**
- Endpoints respond with `Content-Type: application/json`
- Response body is JSON (not HTML pages)

✅ **No Server-Side Rendering**
- No Thymeleaf or other template engines
- No JSP files
- No static HTML served from backend

✅ **No Frontend Code in Backend**
- `src/main/resources/static/` → Empty
- `src/main/resources/templates/` → Empty

✅ **Separation of Concerns**
- Backend handles: Business logic, data, security
- Frontend handles: UI, user experience, layout
- Clear division of responsibilities

### Request/Response Example

**Frontend Request:**
```http
GET /api/suppliers?page=1&size=20
```

**Backend Response (JSON):**
```json
{
  "content": [
    { "id": "SUP-001", "name": "Widget Corp", "email": "contact@widgetcorp.com" },
    { "id": "SUP-002", "name": "Gadget Inc", "email": "info@gadgetinc.com" }
  ],
  "page": 1,
  "totalPages": 5,
  "totalElements": 92
}
```

**Frontend renders this JSON into HTML** (using React, Vue, Angular, etc.)

---

## Directory Structure

### Actual Files in Resources

```
src/main/resources/
├── application.yml              # Spring Boot config (load this!)
├── application-prod.yml
├── application-test.yml
├── application.properties
├── templates/                   # EMPTY (no backend templates)
│   └── (no files)
├── static/                      # EMPTY (no static files here)
│   └── (no files)
└── logback-spring.xml          # (if present, logging config)
```

### What's Actually Empty

| Directory | Purpose | Status | Why |
|-----------|---------|--------|-----|
| `templates/` | Thymeleaf/FreeMarker templates | ❌ Empty | API returns JSON, not HTML |
| `static/` | CSS, JavaScript, images | ❌ Empty | Frontend handles presentation |
| `public/` | Alternative static location | ❌ Empty | Same reason |

---

## Frontend Location

### Where Frontend Code Lives

**Location:** `/frontend` directory (project root level, not in backend)

```
inventory-service/  (git root)
├── src/                         # Backend (Java)
│   ├── main/java
│   ├── main/resources
│   └── test/
├── frontend/                    # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── App.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docs/                        # This documentation
├── pom.xml                      # Backend build (Maven)
├── docker-compose.yml
├── fly.toml
└── README.md
```

### Frontend Technology Stack

| Component | Technology |
|-----------|-----------|
| **Framework** | React |
| **Language** | TypeScript |
| **Build Tool** | Vite |
| **Package Manager** | npm |
| **Styling** | TBD (check frontend/package.json) |

### Frontend Deployment

**Deployed Separately** from backend:
- Backend: Fly.io (Java/Spring Boot)
- Frontend: Typically Vercel, Netlify, or Fly.io (as separate service)

**Example deployment flow:**
```
Push to origin/main
    ↓
GitHub Actions triggers 2 deployments:
    ├─→ Backend build & deploy (Java → Fly.io)
    └─→ Frontend build & deploy (React → Vercel)
    ↓
Both services deployed independently
```

### Frontend-Backend Communication

**HTTP Protocol:**

```
Frontend (React):
  const response = await fetch('https://api.example.com/api/suppliers');
  const data = await response.json();
  // Renders data with React components

Backend (Spring Boot):
  @GetMapping("/api/suppliers")
  public Page<SupplierDTO> getSuppliers(...) {
    return supplierService.findAll(...);  // Returns JSON
  }
```

**CORS Configuration:** Backend enables CORS for frontend domain
```yaml
# See Security Architecture docs for CORS config
```

---

## Why No Backend Templates

### Historical Context

Earlier web development used **server-side rendering**:

```
Browser → Request HTML file
    ↓
Server → Generate HTML from template + data
    ↓
Server → Send complete HTML page
    ↓
Browser → Render HTML
```

**Tools:** Thymeleaf, JSP, ERB, Jinja2

### Modern Architecture (Used Here)

```
Browser → Request JSON from API
    ↓
Server → Return JSON (no rendering)
    ↓
Browser → Receive JSON
    ↓
Browser → Render HTML locally with JavaScript framework
```

**Tools:** React, Vue, Angular, Svelte

### Advantages of API-Only Backend

✅ **Decoupling:**
- Backend and frontend teams work independently
- Backend can serve multiple clients (web, mobile, desktop)
- Frontend can change without backend changes

✅ **Performance:**
- Frontend caching (browser cache, service workers)
- Faster iteration on UI without server redeploy
- Client handles rendering (less server load)

✅ **Scalability:**
- Frontend served from CDN (static files)
- Backend scales horizontally without UI concerns
- Separate deployments prevent coupling

✅ **Developer Experience:**
- Frontend developers use modern tools (Vite, npm, webpack)
- Backend developers use Java/Spring tools
- Clear separation of concerns
- Easier testing and debugging

---

## CORS Configuration

Because frontend and backend are separate, **Cross-Origin Resource Sharing (CORS)** must be configured.

### What is CORS?

```
Frontend at: https://myapp.com (runs in browser)
Backend at:  https://api.example.com

Browser blocks requests from frontend to backend
  (Security feature: prevent unauthorized cross-domain requests)

Solution: Backend must explicitly allow requests from frontend
  (via CORS headers)
```

### Backend CORS Configuration

**See:** [Security Architecture - CORS Configuration](../security/index.html)

**Example:**
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://myapp.com")  // Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

---

## API Documentation for Frontend Developers

### OpenAPI/Swagger

**Automatic API docs generated from code:**

```bash
# Access at:
http://localhost:8081/swagger-ui.html
```

**Provides:**
- Interactive API explorer
- Request/response examples
- Parameter documentation
- Try it out functionality

### Frontend Integration

**Frontend uses generated API client:**

```typescript
// React component
import { supplierApi } from '@/api/suppliers';

export function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    supplierApi.getAll()
      .then(response => setSuppliers(response.data))
      .catch(error => console.error(error));
  }, []);

  return (
    <div>
      {suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)}
    </div>
  );
}
```

---

## Summary

| Aspect | Backend | Frontend |
|--------|---------|----------|
| **Location** | src/main/java, src/main/resources | /frontend |
| **Technology** | Spring Boot, Java | React, TypeScript |
| **Returns** | JSON | HTML (rendered by React) |
| **Serves Static Files** | No (empty static/ folder) | Yes (public/ folder) |
| **Templates** | None (REST API only) | JSX/TSX components |
| **Deployed To** | Fly.io | Vercel/Netlify/CDN |
| **Port** | 8081 (API) | 5173 (dev), 443 (prod) |

---

## Getting Started with Frontend

### Develop Locally

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Frontend runs at: http://localhost:5173
# Backend at: http://localhost:8081
```

### Build for Production

```bash
cd frontend

# Build optimized bundle
npm run build

# Output in: frontend/dist/

# This is deployed to CDN or frontend hosting
```

### Frontend Documentation

**See:** `/frontend/README.md` for frontend-specific setup and development

---

[⬅️ Back to Resources Index](./index.html)
