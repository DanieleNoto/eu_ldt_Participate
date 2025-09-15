# Health Monitoring System

## Overview

This health monitoring system provides comprehensive monitoring of all services defined in the docker-compose.yml file. The system is designed to report the status to Kubernetes and meets the requirements for monitoring availability, performance, and operational status of all critical components.

## Architecture

The health monitoring system consists of:

1. **Health Service** (`src/services/health.service.ts`) - Core logic for health checks
2. **Health Controller** (`src/controllers/health.controller.ts`) - HTTP endpoints
3. **Health Routes** (`src/routes/health.routes.ts`) - Route definitions
4. **Health Schemas** (`src/schemas/health.schema.ts`) - Data validation schemas

## Monitored Services

The system monitors all services from docker-compose.yml:

### Core Infrastructure

- **Database (PostgreSQL)** - Connection and query validation
- **Redis** - Connection and ping test
- **Decidim** - Main application health endpoint
- **Shakapacker** - Asset compilation service

### Analytics & Monitoring

- **Grafana** - Analytics dashboard availability
- **Matomo** - Web analytics service
- **Matomo DB (MariaDB)** - Analytics database

### Communication Services

- **Jitsi Web** - Video conferencing web interface
- **Jitsi Prosody** - XMPP server (indirect monitoring)
- **Jitsi Jicofo** - Conference focus component (indirect monitoring)
- **Jitsi JVB** - Video bridge component (indirect monitoring)

### Additional Checks

- **Internal Component** - Memory usage and internal metrics

## Health Check Endpoints

### 1. Comprehensive Health Check

```
GET /health
```

Returns detailed health status of all monitored services.

**Response Example:**

```json
{
	"status": "Healthy",
	"checks": {
		"database": {
			"status": "Healthy",
			"timestamp": "2025-09-09T10:30:00.000Z",
			"responseTime": 45,
			"details": "Database connection successful"
		},
		"redis": {
			"status": "Healthy",
			"timestamp": "2025-09-09T10:30:00.000Z",
			"responseTime": 12,
			"details": "Redis connection successful"
		},
		"decidim": {
			"status": "Healthy",
			"timestamp": "2025-09-09T10:30:00.000Z",
			"responseTime": 123,
			"details": "Decidim is responsive (HTTP 200)"
		}
		// ... other services
	},
	"timestamp": "2025-09-09T10:30:00.000Z",
	"version": "1.0.0"
}
```

### 2. Readiness Check (Kubernetes)

```
GET /health/ready
```

Checks only critical dependencies required for the service to be ready to serve traffic.

**Monitored Services:**

- Database
- Redis

### 3. Liveness Check (Kubernetes)

```
GET /health/live
```

Simple check to verify the process is alive and responding.

### 4. Service Status Overview

```
GET /health/services
```

Returns status of all individual services without overall status calculation.

### 5. Kubernetes Health Check

```
GET /health/kubernetes
```

Specialized endpoint for Kubernetes integration with boolean healthy flag.

**Response Example:**

```json
{
	"healthy": true,
	"details": {
		"status": "Healthy",
		"checks": {
			/* ... all service checks ... */
		},
		"timestamp": "2025-09-09T10:30:00.000Z"
	}
}
```

## Health Status Types

- **Healthy** - Service is fully operational
- **Degraded** - Service is operational but with issues (timeouts, high response times)
- **Unhealthy** - Service is not operational

## Configuration

### Environment Variables

The system uses the following environment variables for service URLs:

```bash
# Core Services
DATABASE_HOST=db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=decidim_application_development
REDIS_URL=redis://redis:6379/0

# Service URLs (auto-configured based on docker-compose services)
DECIDIM_URL=http://decidim:3000
GRAFANA_URL=http://grafana:3000
MATOMO_URL=http://matomo:80
JITSI_WEB_URL=http://jitsi-web:80
SHAKAPACKER_URL=http://shakapacker:3035
```

### Timeouts and Retries

- **Default HTTP timeout**: 5 seconds
- **Database timeout**: Built into Sequelize configuration
- **Redis timeout**: 5 seconds connection, 5 seconds command
- **Extended timeout for Decidim**: 10 seconds (may take longer to respond)

## Kubernetes Integration

### Deployment Configuration

For Kubernetes deployment, add the following to your deployment manifest:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: euldt-participate-backend
spec:
    template:
        spec:
            containers:
                - name: backend
                  image: your-backend-image
                  ports:
                      - containerPort: 3000
                  livenessProbe:
                      httpGet:
                          path: /health/live
                          port: 3000
                      initialDelaySeconds: 30
                      periodSeconds: 10
                      timeoutSeconds: 5
                      failureThreshold: 3
                  readinessProbe:
                      httpGet:
                          path: /health/ready
                          port: 3000
                      initialDelaySeconds: 5
                      periodSeconds: 5
                      timeoutSeconds: 3
                      failureThreshold: 3
```

### Service Monitor (Prometheus)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
    name: euldt-participate-health
spec:
    selector:
        matchLabels:
            app: euldt-participate-backend
    endpoints:
        - port: http
          path: /health
          interval: 30s
```

## Monitoring and Alerting

### Grafana Dashboard

The health check data can be visualized in Grafana with the following metrics:

1. **Overall System Health** - Current status across all services
2. **Service Response Times** - Performance metrics per service
3. **Service Availability** - Uptime percentage per service
4. **Error Rate** - Percentage of failed health checks

### Alert Rules

Recommended alerting rules:

1. **Critical Alert**: Overall system status is "Unhealthy"
2. **Warning Alert**: Any service status is "Degraded"
3. **Info Alert**: Service response time exceeds thresholds

## Development and Testing

### Local Testing

Run the health checks locally:

```bash
# Start the backend service
npm run dev

# Test health endpoints
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
curl http://localhost:3000/health/services
curl http://localhost:3000/health/kubernetes
```

### Unit Tests

Create unit tests for health service components:

```typescript
// Example test structure
describe('HealthService', () => {
	describe('checkDatabase', () => {
		it('should return healthy status when database is accessible', async () => {
			// Test implementation
		});
	});

	describe('checkRedis', () => {
		it('should return healthy status when Redis is accessible', async () => {
			// Test implementation
		});
	});
});
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

    - Check DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD
    - Verify PostgreSQL service is running
    - Check network connectivity

2. **Redis Connection Failed**

    - Verify REDIS_URL configuration
    - Check Redis service status
    - Validate Redis authentication if required

3. **HTTP Service Timeouts**
    - Check if services are running
    - Verify network configuration
    - Review service logs for errors

### Debug Mode

Enable debug logging by setting environment variable:

```bash
LOG_LEVEL=debug
```

## Performance Considerations

- Health checks run in parallel where possible
- Configurable timeouts prevent hanging requests
- Failed health checks don't cascade failures
- Lightweight checks minimize resource usage

## Security Considerations

- Health endpoints don't expose sensitive configuration
- Network access should be restricted to monitoring systems
- Consider authentication for production health endpoints

## Future Enhancements

1. **Custom Health Checks** - Add application-specific health validations
2. **Historical Data** - Store health check history for trend analysis
3. **Dependency Mapping** - Visual service dependency graphs
4. **Auto-remediation** - Automatic restart of unhealthy services
5. **Multi-region Support** - Health checks across multiple deployment regions
