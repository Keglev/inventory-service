# SmartSupplyPro

**Enterprise Inventory Management System - Java Spring Boot & React**

*Complete enterprise-style full-stack application for Inventory & Supplier Management with comprehensive documentation, security architecture, and CI/CD integration.*

This project simulates a real-world software system for small-to-medium manufacturing companies, inspired by real job experience in purchasing and production planning. It includes modern technologies, authentication, CI/CD, testing, and data visualizations.

> ⚠️ Project still under development!  
![CI](https://github.com/Keglev/inventory-service/actions/workflows/ci.yml/badge.svg)

**📅 Last Updated:** October 8, 2025 - Enterprise Documentation Organization Complete  
**🏗️ Status:** 60,000+ words comprehensive documentation | Enterprise architecture | Working CI/CD pipeline

---

## 🎯 **ENTERPRISE DOCUMENTATION ORGANIZATION COMPLETE**

**✅ 60,000+ words comprehensive documentation**  
**✅ Professional API documentation hub**  
**✅ Complete architecture documentation**  
**✅ Working CI/CD pipeline**

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

---

## 🛡️ Security

- OAuth2 login with role-based access (`ADMIN`, `USER`)
- All `/api/**` endpoints are secured
- Fine-grained access using `@PreAuthorize`
- Swagger is **not used** for runtime documentation to simplify security configuration

---

## 📘 Documentation

### 🚀 API Documentation Hub

**Enterprise-grade API documentation** with comprehensive guides, security architecture, and integration resources:

- **🌐 Complete API Documentation:** https://keglev.github.io/inventory-service/api/redoc/index.html
- **📖 Interactive API Reference:** https://keglev.github.io/inventory-service/api/redoc/api.html
- **📋 API Documentation Hub:** [docs/api/README.md](./docs/api/README.md)

### 🛡️ Security & Architecture

**Comprehensive security documentation** with OAuth2 implementation and enterprise patterns:

- **🔐 OAuth2 Security Architecture:** [docs/architecture/patterns/oauth2-security-architecture.md](./docs/architecture/patterns/oauth2-security-architecture.md) *(728+ lines)*
- **🔒 Security Patterns:** [docs/architecture/patterns/security-patterns.md](./docs/architecture/patterns/security-patterns.md) *(280+ lines)*
- **⚙️ Security Implementation:** [docs/architecture/patterns/security-implementation-patterns.md](./docs/architecture/patterns/security-implementation-patterns.md)
- **🔄 Cross-Cutting Security:** [docs/architecture/patterns/security-cross-cutting-patterns.md](./docs/architecture/patterns/security-cross-cutting-patterns.md)

### 🏗️ Backend Architecture

**Complete backend transformation** with enterprise-level documentation covering all layers:

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

| Module                | OpenAPI Documentation |
|-----------------------|------------------------|
| 🔐 Auth (OAuth2 `/api/me`)         | [auth-api.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/auth/auth-api.yaml) |
| 📦 Inventory Items     | [inventory-*.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/inventory/) |
| 🚚 Suppliers           | [supplier-api.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/suppliers/supplier-api.yaml) |
| 🔁 Stock History       | [stock-history-api.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/stock-history/stock-history-api.yaml) |
| 📊 Analytics           | [analytics-*.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/analytics/) |
| ❤️ Health Check       | [health-check-api.yaml](https://keglev.github.io/inventory-service/api/openapi/paths/health/health-check-api.yaml) |

Browse all docs in one place:
👉 [**Inventory API Index**](https://keglev.github.io/inventory-service/api/redoc/index.html)

---

## 🧪 Testing & Code Quality

### Backend Test Coverage
- **JUnit 5** with Mockito for unit tests
- **Testcontainers** for integration tests
- **JaCoCo** for code coverage analysis

📊 **View Live Coverage Reports:**
👉 [**Backend Test Coverage (JaCoCo)**](https://keglev.github.io/inventory-service/backend/coverage/index.html)

> Coverage reports are automatically updated on every CI build and published via GitHub Pages.

### Frontend Testing (Planned)
- Vitest for unit tests
- React Testing Library for component tests
- Coverage reports coming soon

---

## 🧰 Tech Stack

### Backend
- Java 17+, Spring Boot 3.5+
- Spring Security (OAuth2 + Role-based Access)
- Oracle Autonomous DB (Free Tier)
- REST APIs documented via OpenAPI YAML
- Docker, JUnit, Mockito

### Frontend (WIP)
- React + TypeScript
- Tailwind CSS, Axios, Chart.js
- React Router, React Testing Library, Jest

### DevOps
- GitHub Actions (CI/CD)
- Docker Compose
- Vercel (Frontend) / Fly.io or Oracle Cloud (Backend)

---

## 🌐 Environment Profiles

- `application-dev.yml` — for local testing (auto-reload, detailed logs)
- `application-prod.yml` — used in Docker + CI/CD
- `application-test.yml` — used in unit + integration test containers

Oracle Wallet authentication is used in all environments via environment variables for secure DB access.

---

## ✅ CI/CD

GitHub Actions automatically:
- Builds and tests the backend using Maven
- Runs unit + integration tests with Testcontainers
- Builds Docker image and optionally pushes to DockerHub

> Frontend CI/CD is planned after backend is fully stabilized.

---
## 🔌 Oracle Wallet Connectivity Test

This project includes a standalone Java utility to manually test the Oracle Wallet connection **outside Spring Boot**. This is helpful for validating database access and credentials securely.

### Prerequisites

1. Java and Oracle JDBC Driver in `/lib`
2. Oracle Wallet files downloaded and placed locally
3. `.env` file with the following keys:
   ```env
   ENABLE_WALLET_TEST=true
   TNS_ADMIN=/path/to/wallet
   ORACLE_WALLET_PASSWORD=your_wallet_password
   DB_URL=jdbc:oracle:thin:@your-db
   DB_USERNAME=your_user
   DB_PASSWORD=your_password

## 🏗️ Architecture Overview

- Modular domain-driven design (separate DTO, validation, service, repository layers)
- Full test coverage planned (unit, integration, and MockMvc)
- Designed for microservices: decoupled backend, frontend, and deployment

---

## 🚀 Deployment

### CI/CD Pipeline
- **Backend CI**: Automatic build, test, and Docker image push on backend file changes
- **Frontend CI**: Automatic build, test, and deployment to Koyeb on frontend file changes
- **Manual Production Deploy**: Due to Oracle free tier IP restrictions, backend deployment requires manual execution from local machine

### Production Deployment Workflow

1. **Push backend changes** → Triggers CI build → Docker image built and pushed
2. **Manual deployment** from local machine (required for Oracle IP whitelist):
   
   ```bash
   # Traditional approach - builds and deploys directly
   fly deploy
   ```
   
   This method:
   - ✅ Builds image locally using your whitelisted IP
   - ✅ No need to update Oracle IP whitelist frequently
   - ✅ Same reliable process as before
   - ✅ No dependency on external Docker images

3. **Verify deployment**:
   - Backend: https://inventoryservice.fly.dev
   - Frontend: https://inventory-service.koyeb.app

### Why This Approach Works Best
- **Oracle free tier** requires IP whitelisting, but your IP changes frequently
- **Local build** uses your current IP during Docker build process
- **Fly.io deploys** the locally built image without needing external image pulls
- **No daily IP updates** required in Oracle Cloud Console

### Environment Variables
- **Production**: Uses `application-prod.yml` profile
- **Oracle Database**: Requires IP whitelisting, handled during local build
- **Secrets**: Managed via GitHub Secrets and Fly.io secrets

---

## 👀 Coming Next
- Frontend React dashboard
- Jenkins-based parallel CI pipeline (optional)
- Dynamic chart filtering + analytics export

---

📬 For questions or contributions, feel free to [open an issue](https://github.com/Keglev/inventory-service/issues).

