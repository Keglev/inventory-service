# SmartSupplyPro

**Enterprise Inventory Management System - Java Spring Boot & React**

## About

Complete enterprise-style full-stack application for Inventory & Supplier Management with comprehensive documentation, security architecture, and CI/CD integration.

## Description
This project simulates a real-world software system for small-to-medium manufacturing companies, inspired by real job experience in purchasing and production planning. It includes modern technologies, OAuth2 authentication, automated CI/CD pipelines, comprehensive testing, and business intelligence visualizations.

> ⚠️ **Still under construction** - Enterprise documentation is not yet complete  

![CI Backend](https://github.com/Keglev/inventory-service/actions/workflows/ci-build.yml/badge.svg)  
![CI Frontend](https://github.com/Keglev/inventory-service/actions/workflows/frontend-ci.yml/badge.svg)

**📅 Last Updated:** October 9, 2025 - Controller Layer Testing Architecture Complete  
**🏗️ Status:** 60,000+ words comprehensive documentation | Enterprise architecture | Working CI/CD pipeline

---

## Screenshots

<img src="./frontend/src/assets/project-image.png" alt="Analytics Dashboard" width="600" height="300"/>

<img src="./frontend/src/assets/barchart.png" alt="Analytics Dashboard" width="600" height="300"/>

---

## 🎯 **PROJECT STATUS - STILL UNDER CONSTRUCTION**

**✅ Backend Development - Complete**
- ✅ 60,000+ words comprehensive documentation
- ✅ Professional API documentation with TypeDoc, OpenAPI, and Redoc
- ✅ Complete backend architecture with enterprise patterns
- ✅ Working CI/CD pipeline for backend
- ✅ Controller layer testing architecture complete

**🚧 Frontend Development - In Progress**
- ✅ React + TypeScript + Material-UI foundation
- ✅ CI/CD pipeline working and automatically deployed
- 🚧 Dashboard UI development ongoing
- 🚧 CRUD operations implementation needed
- 🚧 Frontend testing documentation needed

**📚 Documentation Status**
- ✅ Backend testing documentation complete
- 🚧 Frontend testing documentation needed
- 🚧 Complete integration testing documentation needed

---

## 🚀 Features

### 🎯 Core Modules
- ✅ **Authentication** with Google OAuth2 via Spring Security
- 📦 **Inventory Management** – CRUD items, quantity tracking, stock history
- 🧾 **Supplier Management** – CRUD supplier data, filtering by name  
- 📊 **Analytics & Dashboard** – Visual insights including:
  - Stock value over time
  - Monthly stock movement
  - Update frequency per item
  - Low stock alerts

### 🚧 Frontend Development Status
- ✅ **React Dashboard Foundation** - Material-UI components and routing
- ✅ **Authentication Integration** - OAuth2 login flow working
- 🚧 **CRUD Operations** - Still developing frontend forms and data management
- 🚧 **Dynamic Chart Filtering** - Analytics visualization enhancements needed

---

## 🛡️ Security

- OAuth2 login with Google integration and role-based access (`ADMIN`, `USER`)
- All `/api/**` endpoints are secured with Spring Security
- Fine-grained access control using `@PreAuthorize` annotations
- **Note**: Swagger is **not used** for security simplification - instead using TypeDoc, OpenAPI, and Redoc for API documentation

---

## 📘 Documentation

### 🚀 API Documentation Hub

**Enterprise-grade API documentation** with comprehensive guides, security architecture, and integration resources:

- **🌐 Complete API Documentation:** https://keglev.github.io/inventory-service/api/redoc/index.html
- **📖 Interactive API Reference:** https://keglev.github.io/inventory-service/api/redoc/api.html
- **📋 API Documentation Hub:** [docs/api/README.md](./docs/api/README.md)

### 🛡️ Security & Architecture

**Comprehensive security documentation** with OAuth2 implementation and enterprise patterns:

### 🏗️ Architecture Overview

**Complete backend transformation** with enterprise-level documentation covering all layers:

- **🔐 OAuth2 Security Architecture:** [docs/architecture/patterns/oauth2-security-architecture.md](./docs/architecture/patterns/oauth2-security-architecture.md) *(728+ lines)*
- **🔒 Security Patterns:** [docs/architecture/patterns/security-patterns.md](./docs/architecture/patterns/security-patterns.md) *(280+ lines)*
- **⚙️ Security Implementation:** [docs/architecture/patterns/security-implementation-patterns.md](./docs/architecture/patterns/security-implementation-patterns.md)
- **🔄 Cross-Cutting Security:** [docs/architecture/patterns/security-cross-cutting-patterns.md](./docs/architecture/patterns/security-cross-cutting-patterns.md)
- **📚 Backend Documentation Hub:** [docs/backend/README.md](./docs/backend/README.md)
- **🔧 Service Layer Architecture:** [docs/architecture/services/README.md](./docs/architecture/services/README.md)
- **🎨 Design Patterns:** [docs/architecture/patterns/](./docs/architecture/patterns/)
- **📊 Test Coverage Reports:** [docs/backend/coverage/](./docs/backend/coverage/)

### 📡 API Integration Guides

**Comprehensive integration documentation** for all backend layers:

- **⚠️ Exception Handling:** [docs/architecture/exceptions/](./docs/architecture/exceptions/) *(25,000+ words)*
- **🗺️ Mapper Patterns:** [docs/architecture/mappers/](./docs/architecture/mappers/) *(35,000+ words)*
- **📊 Enum Business Logic:** [docs/architecture/enums/](./docs/architecture/enums/)
- **🔗 Configuration Patterns:** [docs/architecture/patterns/](./docs/architecture/patterns/)
- **🔄 Refactoring Roadmap:** [docs/architecture/refactoring/](./docs/architecture/refactoring/)

**Service Documentation:**
- [AnalyticsService](./docs/architecture/services/analytics-service.md) - Business insights, WAC algorithm (🔴 HIGH complexity)
- [InventoryItemService](./docs/architecture/services/inventory-item-service.md) - Inventory CRUD, stock history (🟡 MEDIUM complexity)
- [SupplierService](./docs/architecture/services/supplier-service.md) - Master data management (🟢 LOW complexity)
- [StockHistoryService](./docs/architecture/services/stock-history-service.md) - Append-only audit log (🟢 LOW complexity)
- [OAuth2 Services](./docs/architecture/services/oauth2-services.md) - Authentication integration (🟡 MEDIUM complexity)

### API Endpoints (OpenAPI Specs)

**Complete API documentation with interactive exploration:**

| Module                | Documentation |
|-----------------------|----------------|
| 🔐 **Authentication (OAuth2)**     | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Authentication) |
| 📦 **Inventory Management**        | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Inventory-Items) |
| 🚚 **Supplier Management**         | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Suppliers) |
| 🔁 **Stock History Tracking**      | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Stock-History) |
| 📊 **Analytics & Reports**         | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Analytics) |
| ❤️ **Health Monitoring**          | [Interactive API Reference](https://keglev.github.io/inventory-service/api/redoc/api.html#tag/Health-Check) |

**📋 Complete API Documentation Hub:**
👉 [**Enterprise API Documentation**](https://keglev.github.io/inventory-service/api/redoc/index.html)

---

## 🧪 Testing & Code Quality

**🚧 Still under construction** - Backend testing complete, frontend testing documentation needed

### 🧪 Backend Testing Architecture
- **JUnit 5** with Mockito for comprehensive unit testing
- **Testcontainers** for integration testing with Oracle database
- **MockMvc** for controller layer testing with Spring Security integration
- **JaCoCo** for code coverage analysis and reporting

📊 **View Live Coverage Reports:**
👉 [**Backend Test Coverage (JaCoCo)**](https://keglev.github.io/inventory-service/backend/coverage/index.html)

📚 **Complete Testing Documentation:**
👉 [**Testing Architecture Documentation**](./docs/architecture/testing/README.md) - Enterprise testing strategy and implementation guides

> Coverage reports are automatically updated on every CI build and published via GitHub Pages.

### 🚧 Frontend Testing (Still under construction)
- Vitest for unit testing framework
- React Testing Library for component testing  
- TypeDoc for documentation generation
- Coverage reports and documentation coming soon

---

## 🧰 Tech Stack 

### Backend
- **Java 17+** with **Spring Boot 3.5+**
- **Spring Security** (OAuth2 + Role-based Access Control)
- **Oracle Autonomous Database** (Free Tier with wallet connectivity)
- **REST APIs** documented via OpenAPI YAML specifications
- **Docker** containerization with multi-stage builds
- **JUnit 5** + **Mockito** + **Testcontainers** for comprehensive testing

### Frontend
- **React 19** + **TypeScript** for type-safe development
- **Material-UI (MUI)** for enterprise-grade component library
- **Vite** for fast development and optimized builds
- **Axios** for HTTP client with React Query for state management
- **React Router** for SPA navigation
- **Vitest** + **React Testing Library** for testing
- **TypeDoc** for documentation generation

### DevOps & Infrastructure
- **GitHub Actions** for automated CI/CD pipelines
- **Docker Compose** for local development environment
- **Fly.io** for backend deployment with Oracle DB connectivity
- **Koyeb** for frontend deployment with automated builds
- **JaCoCo** + **GitHub Pages** for live test coverage reporting

---

## 🌐 Environment Profiles

- `application-dev.yml` — Local development (auto-reload, detailed logging)
- `application-prod.yml` — Production deployment (Docker + CI/CD)  
- `application-test.yml` — Testing environment (unit + integration tests with Testcontainers)

Oracle Wallet authentication is configured via environment variables for secure database access across all environments.

---

## ✅ CI/CD

**🚧 Still under construction** - CI/CD is working, documentation updates needed

### 🔄 Automated Pipelines
GitHub Actions automatically handle:

**Backend CI/CD:**
- ✅ Builds and tests Spring Boot application using Maven
- ✅ Runs comprehensive test suite (unit + integration tests with Testcontainers)
- ✅ Generates and publishes test coverage reports to GitHub Pages
- ✅ Builds Docker image and pushes to DockerHub with security scanning
- ✅ Automated deployment ready (manual trigger for Oracle IP restrictions)

**Frontend CI/CD:**
- ✅ Builds and tests React application with Vitest
- ✅ Automatically deploys to Koyeb on successful builds
- ✅ Live deployment at: https://inventory-service.koyeb.app
- ✅ Health checks and smoke tests included

## � Deployment

### CI/CD Pipeline Status
**✅ CI/CD pipelines are working and operational**

**Backend Deployment:**
1. **Automated CI/CD**: Push to main → Triggers build, test, and Docker image creation
2. **Manual Production Deploy**: Due to Oracle free tier IP restrictions, backend deployment uses manual trigger:
   ```bash
   fly deploy
   ```
   This approach:
   - ✅ Uses your whitelisted IP during local Docker build process
   - ✅ Deploys via `fly.toml` configuration with `Dockerfile` and `start.sh` 
   - ✅ No dependency on external Docker registry pulls
   - ✅ Reliable deployment to: https://inventoryservice.fly.dev

**Frontend Deployment:**
- ✅ **Fully Automated**: Push to main → Auto-build and deploy to Koyeb
- ✅ **Live Application**: https://inventory-service.koyeb.app
- ✅ **Health Checks**: Automated smoke tests and health monitoring

### Why This Deployment Strategy Works
- **Oracle Free Tier**: Requires IP whitelisting for database connections
- **Fixed IP Solution**: Using Fly.io VM provides stable IP address
- **Local Build**: Ensures build process uses your whitelisted IP
- **No Daily IP Updates**: Eliminates need to constantly update Oracle IP whitelist

### Production Environment
- **Backend**: Spring Boot with `application-prod.yml` profile
- **Database**: Oracle Autonomous DB with wallet-based authentication
- **Security**: OAuth2 with Google integration
- **Monitoring**: Health check endpoints and application logging

---

## 👀 Coming Next - Still Under Construction

### 🚧 Frontend Development
- **Dashboard UI**: Still developing comprehensive frontend dashboard
- **CRUD Operations**: Still need to implement complete CRUD operations in frontend
- **Dynamic Chart Filtering**: Advanced analytics visualization features

### 🚧 Infrastructure Enhancements
- **Jenkins Parallel CI**: No parallel CI pipeline implementation yet
- **Advanced Monitoring**: Enhanced logging and monitoring capabilities

### 🚧 Documentation
- **Frontend Testing**: Complete frontend testing documentation needed
- **Integration Guides**: Cross-system integration documentation

---

📬 For questions or contributions, feel free to [open an issue](https://github.com/Keglev/inventory-service/issues).

this following part is only for fetching purposes
## Technologies 

- *Java 17+ with Spring Boot 3.5+
- *Spring Security (OAuth2) 
- *Oracle Autonomous Database 
- *REST APIs
- *Docker 
- *JUnit 5 + Mockito 
- *React + TypeScript
- *Material-UI (MUI) 
- *Vite
- *React Router
- *TypeDoc
