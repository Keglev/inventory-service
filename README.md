# SmartSupplyPro

**An enterprise-style full-stack application for Inventory & Supplier Management, built with Java Spring Boot and React.**

This project simulates a real-world software system for small-to-medium manufacturing companies, inspired by real job experience in purchasing and production planning. It includes modern technologies, authentication, CI/CD, testing, and data visualizations.

> ⚠️ Project still under development!
![CI](https://github.com/Keglev/inventory-service/actions/workflows/ci.yml/badge.svg)

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

## 📘 API Documentation (OpenAPI YAML + Redoc)

All endpoints are documented manually via OpenAPI 3.0 YAML files and rendered using [Redoc](https://github.com/Redocly/redoc). This allows clear, secure API sharing without exposing runtime Swagger UI.

- **API (ReDoc):** https://<user>.github.io/<repo>/api.html
- **Security Overview:** https://<user>.github.io/<repo>/architecture/security-overview.md

| Module                | OpenAPI Documentation |
|-----------------------|------------------------|
| 🔐 Auth (OAuth2 `/api/me`)         | [auth-api.yaml](https://keglev.github.io/inventory-service/auth-api.yaml) |
| 📦 Inventory Items     | [inventory-api.yaml](https://keglev.github.io/inventory-service/inventory-api.yaml) |
| 🚚 Suppliers           | [supplier-api.yaml](https://keglev.github.io/inventory-service/supplier-api.yaml) |
| 🔁 Stock History       | [stock-history-api.yaml](https://keglev.github.io/inventory-service/stock-history-api.yaml) |
| 📊 Analytics           | [analytics-api.yaml](https://keglev.github.io/inventory-service/analytics-api.yaml) |
| ❤️ Health Check       | [health-check-api.yaml](https://keglev.github.io/inventory-service/health-check-api.yaml) |

Browse all docs in one place:
👉 [**Inventory API Index**](https://keglev.github.io/inventory-service/index.html)

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

## 👀 Coming Next
- Frontend React dashboard
- Jenkins-based parallel CI pipeline (optional)
- Dynamic chart filtering + analytics export

---

📬 For questions or contributions, feel free to [open an issue](https://github.com/Keglev/inventory-service/issues).

