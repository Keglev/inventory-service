# Backend Test Coverage Reports

This directory contains JaCoCo test coverage reports for the SmartSupplyPro backend.

## 📊 Live Coverage Report

View the interactive coverage report here:
👉 **[Backend Test Coverage](https://keglev.github.io/inventory-service/backend/coverage/index.html)**

## 🔄 How It Works

Coverage reports are **automatically generated and updated** on every CI build:

1. **CI Build** runs `mvn clean verify` which triggers JaCoCo
2. **JaCoCo Plugin** generates HTML reports in `target/site/jacoco/`
3. **GitHub Actions** copies reports to `docs/backend/coverage/`
4. **Git Commit** commits the updated reports with `[skip ci]` tag
5. **GitHub Pages** serves the reports at the URL above

## 📈 Coverage Metrics

The JaCoCo report includes:
- **Line Coverage**: Percentage of code lines executed by tests
- **Branch Coverage**: Percentage of conditional branches tested
- **Method Coverage**: Percentage of methods invoked by tests
- **Class Coverage**: Percentage of classes with at least one test

## 🎯 Current Coverage

To see the latest coverage statistics, visit the [live report](https://keglev.github.io/inventory-service/backend/coverage/index.html).

### Coverage by Package

Navigate through the report to explore:
- `com.smartsupplypro.inventory.controller` - REST API controllers
- `com.smartsupplypro.inventory.service` - Business logic services
- `com.smartsupplypro.inventory.repository` - Data access layer
- `com.smartsupplypro.inventory.security` - OAuth2 security configuration
- `com.smartsupplypro.inventory.validation` - Request validation logic

## 🛠️ Generating Reports Locally

To generate coverage reports on your local machine:

```bash
# Run tests with coverage
mvn clean verify

# View reports in browser
start target/site/jacoco/index.html  # Windows
# or
open target/site/jacoco/index.html   # macOS/Linux
```

## 📝 Report Files

- `index.html` - Main coverage dashboard
- `jacoco.xml` - XML format (for CI/CD integration)
- `jacoco.csv` - CSV format (for data analysis)
- `jacoco-sessions.html` - Test execution sessions

## ⚙️ Configuration

JaCoCo configuration is in `pom.xml`:
- Plugin: `jacoco-maven-plugin` version 0.8.12
- Execution: Runs on `mvn verify` phase
- Output: `target/site/jacoco/`

## 🚀 GitHub Pages Setup

This project uses GitHub Pages to serve documentation:
- **Source**: `main` branch → `/docs` folder
- **URL**: https://keglev.github.io/inventory-service/
- **Coverage**: https://keglev.github.io/inventory-service/backend/coverage/

### Verifying GitHub Pages

1. Go to repository **Settings** → **Pages**
2. Verify **Source** is set to: `Deploy from a branch`
3. Verify **Branch** is: `main` → `/docs`
4. Check **Build Status**: Should show "Your site is live"

## 🔗 Related Documentation

- [API Documentation](https://keglev.github.io/inventory-service/api/redoc/api.html)
- [API Documentation Hub](https://keglev.github.io/inventory-service/api/redoc/index.html)
- [Security Architecture](../architecture/patterns/oauth2-security-architecture.md)

---

📬 For questions about test coverage, [open an issue](https://github.com/Keglev/inventory-service/issues).
