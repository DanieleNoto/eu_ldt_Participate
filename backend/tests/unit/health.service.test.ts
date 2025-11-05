import HealthService from '../../src/services/health.service';
import { HealthStatus } from '../../src/enums/health-status.enum';

describe('HealthService', () => {
	describe('liveness check', () => {
		it('should always return healthy status for liveness', async () => {
			const result = await HealthService.live();

			expect(result.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks.process).toBeDefined();
			expect(result.checks.process.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks.process.details).toBe('Process is running');
			expect(result.timestamp).toBeDefined();
		});
	});

	describe('comprehensive health check', () => {
		it('should return health status with all service checks', async () => {
			const result = await HealthService.health();

			expect(result.status).toBeDefined();
			expect(result.checks).toBeDefined();
			expect(result.timestamp).toBeDefined();

			// Verify all expected services are checked
			expect(result.checks.database).toBeDefined();
			expect(result.checks.redis).toBeDefined();
			expect(result.checks.decidim).toBeDefined();
			expect(result.checks.grafana).toBeDefined();
			expect(result.checks.matomo).toBeDefined();
			expect(result.checks.jitsi_web).toBeDefined();
			expect(result.checks.internal_component).toBeDefined();

			// Verify each check has required properties
			Object.values(result.checks).forEach(check => {
				expect(check.status).toBeDefined();
				expect(check.timestamp).toBeDefined();
				expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(check.status);
			});
		}, 60000); // 60 second timeout since services might be unreachable
	});

	describe('readiness check', () => {
		it('should return status for critical dependencies only', async () => {
			const result = await HealthService.ready();

			expect(result.status).toBeDefined();
			expect(result.checks).toBeDefined();
			expect(result.timestamp).toBeDefined();

			// Readiness should only check critical dependencies
			expect(result.checks.database).toBeDefined();
			expect(result.checks.redis).toBeDefined();

			// Should not include optional services
			expect(result.checks.grafana).toBeUndefined();
			expect(result.checks.matomo).toBeUndefined();
		}, 30000); // 30 second timeout
	});

	describe('kubernetes health check', () => {
		it('should return kubernetes-compatible health response', async () => {
			const result = await HealthService.getKubernetesHealthCheck();

			expect(result.healthy).toBeDefined();
			expect(typeof result.healthy).toBe('boolean');
			expect(result.details).toBeDefined();
			expect(result.details.status).toBeDefined();
			expect(result.details.checks).toBeDefined();
			expect(result.details.timestamp).toBeDefined();
		}, 60000);
	});

	describe('service statuses', () => {
		it('should return individual service statuses', async () => {
			const result = await HealthService.getServiceStatuses();

			expect(typeof result).toBe('object');
			expect(Object.keys(result).length).toBeGreaterThan(0);

			// Verify each service has proper health check structure
			Object.values(result).forEach(check => {
				expect(check.status).toBeDefined();
				expect(check.timestamp).toBeDefined();
				expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(check.status);
			});
		}, 60000);
	});
});
