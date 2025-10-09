# Health Check API

**System Monitoring & Application Health**

*Comprehensive health monitoring endpoints for system status, database connectivity, and application performance metrics.*

> ❤️ **Real-time health status** for all system components  
> 📊 **Detailed metrics** including database, security, and performance  
> 🔍 **Dependency monitoring** for external services  

---

## 🎯 Overview

The Health Check API provides comprehensive monitoring capabilities for the SmartSupplyPro inventory management system. This service offers real-time insights into application health, database connectivity, and system performance.

### Key Features

- **❤️ Application Health**: Overall system status
- **💾 Database Health**: Connection and query performance
- **🔒 Security Health**: OAuth2 and session monitoring
- **📊 Performance Metrics**: Response times and throughput
- **🔍 Dependency Status**: External service connectivity

---

## 🌐 API Endpoints

### Health Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | **Basic health check** - simple alive status |
| `GET` | `/api/health/detailed` | **Detailed health status** with all components |
| `GET` | `/api/health/database` | **Database connectivity** status |
| `GET` | `/api/health/security` | **Security system** health |
| `GET` | `/api/health/metrics` | **Performance metrics** and statistics |

---

## 📋 Endpoint Details

### Basic Health Check

**GET** `/api/health`

Simple health check endpoint for load balancers and monitoring systems.

#### Response Format

```json
{
  "status": "UP",
  "timestamp": "2025-10-09T10:30:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Status Values

- `UP`: All systems operational
- `DOWN`: Critical system failure
- `DEGRADED`: Partial functionality available

### Detailed Health Status

**GET** `/api/health/detailed`

Comprehensive health check with detailed component status.

#### Response Format

```json
{
  "status": "UP",
  "timestamp": "2025-10-09T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "components": {
    "database": {
      "status": "UP",
      "details": {
        "connectionPool": {
          "active": 2,
          "idle": 8,
          "max": 10,
          "min": 2
        },
        "responseTime": "15ms",
        "lastCheck": "2025-10-09T10:29:45Z"
      }
    },
    "security": {
      "status": "UP",
      "details": {
        "oauth2Provider": "CONNECTED",
        "sessionStore": "HEALTHY",
        "lastSecurityCheck": "2025-10-09T10:29:30Z"
      }
    },
    "application": {
      "status": "UP",
      "details": {
        "uptime": "72h 15m 32s",
        "jvmMemory": {
          "used": "256MB",
          "total": "512MB",
          "max": "1024MB"
        },
        "activeThreads": 15,
        "loadAverage": 0.35
      }
    },
    "dependencies": {
      "status": "UP",
      "details": {
        "googleOAuth": "CONNECTED",
        "externalAPIs": "HEALTHY"
      }
    }
  },
  "checks": [
    {
      "name": "database-connection",
      "status": "PASS",
      "duration": "15ms",
      "timestamp": "2025-10-09T10:29:45Z"
    },
    {
      "name": "oauth2-connectivity",
      "status": "PASS",
      "duration": "120ms",
      "timestamp": "2025-10-09T10:29:30Z"
    }
  ]
}
```

### Database Health

**GET** `/api/health/database`

Specific database connectivity and performance monitoring.

#### Response Format

```json
{
  "status": "UP",
  "database": {
    "type": "Oracle Autonomous Database",
    "version": "19c",
    "connectionStatus": "CONNECTED",
    "connectionPool": {
      "active": 2,
      "idle": 8,
      "max": 10,
      "min": 2,
      "waitingConnections": 0
    },
    "performance": {
      "averageResponseTime": "15ms",
      "slowestQuery": "45ms",
      "transactionsPerSecond": 12.5,
      "connectionsPerSecond": 0.8
    },
    "healthChecks": {
      "simpleQuery": {
        "status": "PASS",
        "query": "SELECT 1 FROM DUAL",
        "responseTime": "8ms",
        "timestamp": "2025-10-09T10:29:45Z"
      },
      "complexQuery": {
        "status": "PASS",
        "query": "SELECT COUNT(*) FROM inventory_items",
        "responseTime": "23ms",
        "timestamp": "2025-10-09T10:29:45Z"
      }
    }
  }
}
```

### Security Health

**GET** `/api/health/security`

Security system health including OAuth2 and session management.

#### Response Format

```json
{
  "status": "UP",
  "security": {
    "oauth2": {
      "provider": "Google",
      "status": "CONNECTED",
      "lastTokenValidation": "2025-10-09T10:28:15Z",
      "activeTokens": 15,
      "tokenValidationRate": "98.5%"
    },
    "sessions": {
      "activeSessions": 12,
      "averageSessionDuration": "2h 15m",
      "sessionStoreHealth": "HEALTHY",
      "securityEventRate": "0.02/min"
    },
    "rateLimiting": {
      "status": "ACTIVE",
      "requestsBlocked": 3,
      "averageRequestRate": "125/min",
      "peakRequestRate": "450/min"
    }
  }
}
```

### Performance Metrics

**GET** `/api/health/metrics`

Detailed performance metrics and system statistics.

#### Response Format

```json
{
  "timestamp": "2025-10-09T10:30:00Z",
  "uptime": "72h 15m 32s",
  "metrics": {
    "http": {
      "requestsTotal": 15420,
      "requestsPerSecond": 8.5,
      "averageResponseTime": "125ms",
      "errorRate": "0.5%",
      "responseTimePercentiles": {
        "p50": "85ms",
        "p95": "250ms",
        "p99": "450ms"
      }
    },
    "jvm": {
      "memory": {
        "heap": {
          "used": "256MB",
          "committed": "512MB",
          "max": "1024MB"
        },
        "nonHeap": {
          "used": "128MB",
          "committed": "256MB",
          "max": "512MB"
        }
      },
      "threads": {
        "active": 15,
        "daemon": 8,
        "peak": 25,
        "total": 23
      },
      "gc": {
        "collections": 45,
        "totalTime": "2.5s",
        "averageTime": "55ms"
      }
    },
    "database": {
      "connections": {
        "active": 2,
        "idle": 8,
        "total": 10
      },
      "queries": {
        "total": 8520,
        "perSecond": 4.2,
        "averageTime": "15ms",
        "slowQueries": 5
      }
    }
  }
}
```

---

## 🔒 Security & Access

### Endpoint Security

- **Public Access**: `/api/health` (basic check only)
- **Authenticated Access**: All detailed endpoints require authentication
- **Admin Access**: Performance metrics and detailed diagnostics

### Security Features

- **🔒 Rate Limited**: Prevent health check abuse
- **📋 Audit Logged**: All access logged for security
- **🚫 No Sensitive Data**: Health checks exclude sensitive information
- **🔍 Monitoring**: Unusual access patterns detected

---

## 🚨 Alerting & Monitoring

### Status Monitoring

Health checks support integration with monitoring systems:

- **Prometheus Metrics**: Available at `/actuator/prometheus`
- **Custom Alerts**: Configurable thresholds for all metrics
- **Notification Integration**: Slack, email, and webhook support

### Critical Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Database Response Time | > 100ms | > 500ms |
| Memory Usage | > 80% | > 95% |
| Error Rate | > 1% | > 5% |
| Active Connections | > 80% pool | > 95% pool |

---

## 🧪 Testing Examples

### Basic Health Check

```bash
curl -X GET "https://api.smartsupplypro.com/api/health"
```

### Detailed Health Status

```bash
curl -X GET "https://api.smartsupplypro.com/api/health/detailed" \
  -H "Authorization: Bearer your-token"
```

### Database Health Check

```bash
curl -X GET "https://api.smartsupplypro.com/api/health/database" \
  -H "Authorization: Bearer your-token"
```

### Performance Metrics

```bash
curl -X GET "https://api.smartsupplypro.com/api/health/metrics" \
  -H "Authorization: Bearer your-token"
```

---

## 📊 Integration Examples

### Load Balancer Health Check

```yaml
# HAProxy configuration
backend api_servers
    option httpchk GET /api/health
    http-check expect status 200
    http-check expect string "UP"
    server api1 10.0.1.10:8080 check
    server api2 10.0.1.11:8080 check
```

### Kubernetes Health Probe

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: inventory-service
    livenessProbe:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/detailed
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
```

---

## 🔗 Related Documentation

- **📦 [Inventory Items API](inventory-items.md)** - Main inventory management
- **📊 [Analytics API](analytics.md)** - Business intelligence features
- **🔐 [Authentication API](authentication.md)** - OAuth2 security
- **🏗️ [Architecture Documentation](../../architecture/)** - System architecture

---

*Health Check API documentation - Updated October 2025*