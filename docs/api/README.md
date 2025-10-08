# SmartSupplyPro API Documentation Hub

**Version:** 1.0.0  
**Last Updated:** October 8, 2025  
**API Base URL:** `https://inventoryservice.fly.dev/api`  

## 📋 API Documentation Overview

Welcome to the **SmartSupplyPro API Documentation Hub** - your comprehensive gateway to all API resources, endpoints, and integration guides for the SmartSupplyPro inventory management system.

## 🚀 Quick Navigation

### **Core API Documentation**
- 📖 **[Complete API Reference](../redoc/api.html)** - Interactive ReDoc documentation
- 📄 **[OpenAPI Specification](../openapi/openapi.yaml)** - Machine-readable API spec
- 🔗 **[API Index](../redoc/index.html)** - Documentation landing page

### **API Endpoints by Domain**

#### 🏢 **Inventory Management**
- **[Inventory Items API](endpoints/inventory-items.md)** - CRUD operations for inventory items
  - `GET /api/v1/inventory` - List all inventory items
  - `POST /api/v1/inventory` - Create new inventory item
  - `GET /api/v1/inventory/{id}` - Get inventory item details
  - `PUT /api/v1/inventory/{id}` - Update inventory item
  - `DELETE /api/v1/inventory/{id}` - Delete inventory item

#### 📦 **Supplier Management**
- **[Suppliers API](endpoints/suppliers.md)** - Supplier relationship management
  - `GET /api/v1/suppliers` - List all suppliers
  - `POST /api/v1/suppliers` - Create new supplier
  - `GET /api/v1/suppliers/{id}` - Get supplier details
  - `PUT /api/v1/suppliers/{id}` - Update supplier
  - `DELETE /api/v1/suppliers/{id}` - Delete supplier

#### 📊 **Analytics & Reporting**
- **[Analytics API](endpoints/analytics.md)** - Business intelligence and KPIs
  - `GET /api/v1/analytics/dashboard` - Dashboard metrics
  - `GET /api/v1/analytics/inventory-trends` - Inventory trend analysis
  - `GET /api/v1/analytics/supplier-performance` - Supplier performance metrics

#### 📈 **Stock History**
- **[Stock History API](endpoints/stock-history.md)** - Inventory movement tracking
  - `GET /api/v1/stock-history` - List stock movements
  - `GET /api/v1/stock-history/{itemId}` - Item-specific history
  - `POST /api/v1/stock-history` - Record stock movement

#### 🔐 **Authentication & Security**
- **[Authentication API](endpoints/authentication.md)** - OAuth2 and session management
  - `GET /api/v1/auth/login` - OAuth2 login initiation
  - `GET /api/v1/auth/logout` - Session termination
  - `GET /api/v1/auth/user` - Current user information

#### ❤️ **Health & Monitoring**
- **[Health Check API](endpoints/health.md)** - System health and monitoring
  - `GET /api/v1/health` - Application health status
  - `GET /api/v1/health/detailed` - Detailed health metrics

## 🛡️ **Security Documentation**

### **Authentication & Authorization**
- **[OAuth2 Security Architecture](../architecture/patterns/oauth2-security-architecture.md)** - Complete OAuth2 implementation
- **[Security Patterns](../architecture/patterns/security-patterns.md)** - Enterprise security patterns
- **[Security Implementation Guide](../architecture/patterns/security-implementation-patterns.md)** - Implementation details
- **[Cross-Cutting Security](../architecture/patterns/security-cross-cutting-patterns.md)** - Security across layers

### **API Security Features**
- **OAuth2 with Google Identity Provider** - Secure authentication flow
- **Session-based Authorization** - Stateful session management
- **CORS Protection** - Cross-origin request security
- **CSRF Protection** - Cross-site request forgery prevention
- **Role-based Access Control** - Permission-based access

## 📡 **API Integration Guides**

### **Client SDK Documentation**
- **[JavaScript/TypeScript SDK](integration/javascript-sdk.md)** - Frontend integration
- **[React Integration Guide](integration/react-integration.md)** - React-specific patterns
- **[API Error Handling](integration/error-handling.md)** - Error response patterns

### **Integration Patterns**
- **[Exception Integration](../architecture/exceptions/EXCEPTION_INTEGRATION_PATTERNS.md)** - Error handling patterns
- **[Mapper Integration](../architecture/mappers/API_INTEGRATION_PATTERNS.md)** - Data mapping patterns
- **[Configuration Integration](../architecture/patterns/configuration-api-integration.md)** - Configuration patterns

## 🔧 **Development Resources**

### **API Development**
- **[API Design Guidelines](development/api-design-guidelines.md)** - Design standards and best practices
- **[OpenAPI Specification Guide](development/openapi-guide.md)** - How to maintain API specs
- **[Testing Strategies](development/testing-strategies.md)** - API testing approaches

### **Backend Architecture**
- **[Backend Architecture Overview](../../backend/README.md)** - Complete backend architecture
- **[Service Layer Documentation](../../architecture/services/)** - Business logic layer
- **[Repository Patterns](../../architecture/patterns/)** - Data access patterns

## 📊 **API Monitoring & Analytics**

### **Performance Metrics**
- **[API Performance Dashboard](monitoring/performance-dashboard.md)** - Real-time metrics
- **[Response Time Analysis](monitoring/response-times.md)** - Latency monitoring
- **[Error Rate Tracking](monitoring/error-rates.md)** - Error monitoring

### **Business Metrics**
- **[Usage Analytics](monitoring/usage-analytics.md)** - API usage patterns
- **[Business KPI Integration](monitoring/business-kpis.md)** - Business intelligence

## 🚀 **Quick Start Guide**

### **1. Authentication Setup**
```bash
# 1. Configure OAuth2 credentials
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"

# 2. Start the application
./mvnw spring-boot:run

# 3. Access API documentation
open http://localhost:8081/api/docs
```

### **2. Make Your First API Call**
```javascript
// JavaScript example
const response = await fetch('http://localhost:8081/api/v1/inventory', {
  method: 'GET',
  credentials: 'include', // Include session cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

const inventoryItems = await response.json();
console.log(inventoryItems);
```

### **3. Error Handling**
```javascript
try {
  const response = await fetch('/api/v1/inventory', options);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('API Error:', errorData.message);
    console.error('Correlation ID:', errorData.correlationId);
  }
  
} catch (error) {
  console.error('Network Error:', error.message);
}
```

## 📚 **API Reference Formats**

- **🌐 Interactive Documentation** - [ReDoc Interface](../redoc/api.html)
- **📄 OpenAPI 3.0 Specification** - [YAML Format](../openapi/openapi.yaml)
- **📋 Endpoint Documentation** - [Markdown Guides](endpoints/)
- **🔗 Postman Collection** - [Download Collection](postman/SmartSupplyPro.postman_collection.json)

## 🎯 **API Versions & Compatibility**

| Version | Status | Documentation | Support Level |
|---------|--------|---------------|---------------|
| **v1.0** | ✅ Current | [Full Documentation](../redoc/api.html) | Full Support |
| v0.9 | 🔄 Legacy | [Legacy Docs](legacy/v0.9/) | Maintenance Only |

## 📞 **Support & Community**

- **📧 API Support**: [api-support@smartsupplypro.com](mailto:api-support@smartsupplypro.com)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/Keglev/inventory-service/issues)
- **💬 Community**: [Discussions](https://github.com/Keglev/inventory-service/discussions)
- **📖 Changelog**: [API Changelog](changelog/CHANGELOG.md)

## 🏗️ **Enterprise Architecture**

This API is built using enterprise-grade patterns and technologies:

- **🚀 Spring Boot** - Modern Java framework
- **🔐 Spring Security** - Enterprise security
- **📊 JPA/Hibernate** - Object-relational mapping
- **☁️ Cloud-Native** - Container-ready deployment
- **📈 Observability** - Comprehensive monitoring
- **🧪 Test Coverage** - Extensive testing strategy

---

**SmartSupplyPro API Hub** - Enterprise Inventory Management System  
*Last updated: October 8, 2025 | Version 1.0.0*