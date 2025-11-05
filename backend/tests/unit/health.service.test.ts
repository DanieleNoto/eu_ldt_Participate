import { HealthStatus } from '../../src/enums/health-status.enum';
import HealthService from '../../src/services/health.service';

// Mock external dependencies
jest.mock('axios');
jest.mock('ioredis');
jest.mock('../../src/config/database');

const mockAxios = require('axios');
const mockIORedis = require('ioredis');
const mockDatabase = require('../../src/config/database');

// Mock implementations
const mockSequelize = {
	authenticate: jest.fn(),
	query: jest.fn()
};

const mockRedis = {
	ping: jest.fn(),
	quit: jest.fn()
};

mockDatabase.sequelize = mockSequelize;
mockAxios.get = jest.fn();
mockIORedis.mockImplementation(() => mockRedis);

describe('HealthService', () => {
	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup default mock behaviors
		mockSequelize.authenticate.mockResolvedValue(undefined);
		mockSequelize.query.mockResolvedValue(undefined);
		mockRedis.ping.mockResolvedValue('PONG');
		mockRedis.quit.mockResolvedValue(undefined);

		// Mock HTTP calls for external services
		mockAxios.get.mockImplementation((url: string) => {
			if (url.includes('decidim')) {
				return Promise.resolve({ status: 200 });
			}
			if (url.includes('grafana')) {
				return Promise.resolve({ status: 200 });
			}
			if (url.includes('matomo')) {
				return Promise.resolve({ status: 200 });
			}
			if (url.includes('jitsi-web')) {
				return Promise.resolve({ status: 200 });
			}
			return Promise.reject(new Error('Service unavailable'));
		});
	});

	afterEach(() => {
		jest.clearAllTimers();
	});
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
		});

		it('should handle database connection failure', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

			const result = await HealthService.health();

			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.details).toContain('Database connection failed');
		});

		it('should handle Redis connection failure', async () => {
			mockRedis.ping.mockRejectedValue(new Error('Redis connection failed'));

			const result = await HealthService.health();

			expect(result.checks.redis.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.redis.details).toContain('Redis connection failed');
		});

		it('should handle external service failures', async () => {
			mockAxios.get.mockRejectedValue(new Error('Service unavailable'));

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.grafana.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.matomo.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.jitsi_web.status).toBe(HealthStatus.DEGRADED);
		});

		it('should handle connection refused errors as unhealthy', async () => {
			const connectionError = new Error('Connection refused');
			(connectionError as any).code = 'ECONNREFUSED';
			mockAxios.get.mockRejectedValue(connectionError);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.grafana.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.matomo.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.jitsi_web.status).toBe(HealthStatus.UNHEALTHY);
		});
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
		});
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
		});
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
		});
	});
});
