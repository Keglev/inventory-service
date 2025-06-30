# SmartSupplyPro

**An enterprise-style full-stack application for Inventory & Supplier Management, built with Java Spring Boot and React.**

This project simulates a real-world software system for small-to-medium manufacturing companies, inspired by real job experience in purchasing and production planning. It includes modern technologies, authentication, CI/CD, testing, and data visualizations.

Still in development!!
![CI](https://github.com/Keglev/inventory-service/actions/workflows/ci.yml/badge.svg)


---
## 🚀 Features

### 🎯 Core Modules
- ✅ **Authentication** with OAuth2 (Google/GitHub) via Spring Security
- 📦 **Inventory Management** – CRUD items, quantity tracking, stock history
- 🧾 **Supplier Management** – CRUD supplier info, link to inventory
- 📊 **Dashboard with Charts** – Interactive insights:
  - Stock level over time
  - Stock value over time
  - Returns to suppliers
  - Top suppliers by volume

---

## Environment Configuration

This microservice supports multi-environment configuration using Spring Boot profiles:

- `application-dev.yml` — local testing with verbose logs and auto schema updates
- `application-prod.yml` — production config with optimized logging and strict DB validation

Docker and GitHub Actions are configured to build and run the app using the `prod` profile.



## 🧰 Tech Stack

### Backend
- Java 17+, Spring Boot 3
- Spring Security + OAuth2
- Oracle Autonomous DB (Free Tier)
- REST APIs with OpenAPI
- Docker, JUnit, Mockito

### Frontend
- React + TypeScript
- Tailwind CSS
- Axios, React Router
- Chart.js (via `react-chartjs-2`)
- React Testing Library, Jest

### DevOps
- GitHub Actions (CI/CD)
- Docker Compose
- Vercel (Frontend) / Fly.io or Oracle Cloud VM (Backend)

## API Documentation

 - You can check the documentation here:
   👉 [View API Docs (Redoc)](https://<your-username>.github.io/<your-repo>/)

---

## 🛠️ Architecture


