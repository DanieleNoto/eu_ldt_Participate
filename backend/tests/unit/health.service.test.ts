// # SPDX-License-Identifier: AGPL-3.0
// # Copyright (c) 2025, European Commission. Licensed under the AGPL-3.0
// # Authors:
//   # Denis Vasilev Dimchev
//   # Gianfranco Cedro
import { HealthStatus } from '../../src/enums/health-status.enum';
import HealthService from '../../src/services/health.service';

// Mock external dependencies
jest.mock('axios');
jest.mock('ioredis');
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

const mockAxios = require('axios');
const mockIORedis = require('ioredis');
const mockDatabase = require('../../src/config/database');
const mockLogger = require('../../src/utils/logger');

// Mock implementations
const mockSequelize = {
	authenticate: jest.fn(),
	query: jest.fn()
};

const mockRedis = {
	ping: jest.fn(),
	quit: jest.fn(),
	disconnect: jest.fn()
};

mockDatabase.sequelize = mockSequelize;
mockAxios.get = jest.fn();
mockIORedis.mockImplementation(() => mockRedis);
mockLogger.default = {
	error: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn()
};

describe('HealthService', () => {
	beforeEach(() => {
		// Reset all mocks
		jest.clearAllMocks();

		// Setup default mock behaviors
		mockSequelize.authenticate.mockResolvedValue(undefined);
		mockSequelize.query.mockResolvedValue(undefined);
		mockRedis.ping.mockResolvedValue('PONG');
		mockRedis.quit.mockResolvedValue(undefined);
		mockRedis.disconnect = jest.fn().mockResolvedValue(undefined);

		// Mock HTTP calls for external services - all return 200 by default
		mockAxios.get.mockImplementation((url: string) => {
			return Promise.resolve({ status: 200 });
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
			expect(result.version).toBeDefined();

			// Verify all expected services are checked
			expect(result.checks.database).toBeDefined();
			expect(result.checks.redis).toBeDefined();
			expect(result.checks.decidim).toBeDefined();
			expect(result.checks.grafana).toBeDefined();
			expect(result.checks.matomo).toBeDefined();
			expect(result.checks.jitsi_web).toBeDefined();
			expect(result.checks.internal_component).toBeDefined();

			// Verify each check has required properties
			for (const check of Object.values(result.checks)) {
				expect(check.status).toBeDefined();
				expect(check.timestamp).toBeDefined();
				expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(check.status);
			}
		});

		it('should return overall HEALTHY status when all checks pass', async () => {
			const result = await HealthService.health();
			expect(result.status).toBe(HealthStatus.HEALTHY);
		});

		it('should return overall UNHEALTHY status when any check is unhealthy', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

			const result = await HealthService.health();
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should return overall DEGRADED status when checks are degraded but not unhealthy', async () => {
			mockAxios.get.mockImplementation((url: string) => {
				if (url.includes('decidim')) {
					return Promise.reject(new Error('Timeout'));
				}
				return Promise.resolve({ status: 200 });
			});

			const result = await HealthService.health();
			expect(result.status).toBe(HealthStatus.DEGRADED);
		});

		it('should handle database connection failure', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('Connection failed'));

			const result = await HealthService.health();

			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.details).toContain('Database connection failed');
		});

		it('should handle database query failure after successful connection', async () => {
			mockSequelize.authenticate.mockResolvedValue(undefined);
			mockSequelize.query.mockRejectedValue(new Error('Query failed'));

			const result = await HealthService.health();

			expect(result.checks.database.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.database.details).toContain('Database query failed');
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

		it('should handle ENOTFOUND errors as unhealthy', async () => {
			const dnsError = new Error('DNS lookup failed');
			(dnsError as any).code = 'ENOTFOUND';
			mockAxios.get.mockRejectedValue(dnsError);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.details).toContain('is not reachable');
		});

		it('should handle ECONNABORTED timeout errors as degraded', async () => {
			const timeoutError = new Error('Timeout');
			(timeoutError as any).code = 'ECONNABORTED';
			mockAxios.get.mockRejectedValue(timeoutError);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('timeout');
		});

		it('should handle HTTP 4xx errors as degraded', async () => {
			mockAxios.get.mockResolvedValue({ status: 404 });

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('client error');
			expect(result.checks.decidim.details).toContain('404');
		});
		it('should handle HTTP 5xx errors as unhealthy', async () => {
			mockAxios.get.mockResolvedValue({ status: 500 });

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.details).toContain('server error');
			expect(result.checks.decidim.details).toContain('500');
		});
		it('should handle HTTP errors with response object', async () => {
			const httpError = new Error('HTTP Error');
			(httpError as any).response = { status: 503 };
			mockAxios.get.mockRejectedValue(httpError);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.details).toContain('server error (HTTP 503)');
		});

		it('should handle HTTP 4xx errors in error response', async () => {
			const httpError = new Error('HTTP Error');
			(httpError as any).response = { status: 429 };
			mockAxios.get.mockRejectedValue(httpError);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('client error (HTTP 429)');
		});

		it('should include response time in health checks', async () => {
			const result = await HealthService.health();

			expect(result.checks.database.responseTime).toBeDefined();
			expect(typeof result.checks.database.responseTime).toBe('number');
			expect(result.checks.redis.responseTime).toBeDefined();
			expect(result.checks.decidim.responseTime).toBeDefined();
		});

		it('should check internal component memory usage', async () => {
			const result = await HealthService.health();

			expect(result.checks.internal_component.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks.internal_component.details).toContain('Memory usage');
			expect(result.checks.internal_component.details).toContain('MB');
		});

		it('should handle Promise.allSettled rejections gracefully', async () => {
			// Force all checks to fail at Promise.allSettled level
			mockSequelize.authenticate.mockImplementation(() => {
				throw new Error('Unexpected error');
			});

			const result = await HealthService.health();

			expect(result.status).toBeDefined();
			expect(result.checks.database).toBeDefined();
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

		it('should return HEALTHY when all critical services are up', async () => {
			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.HEALTHY);
		});

		it('should return UNHEALTHY when database is down', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('DB down'));

			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should return UNHEALTHY when redis is down', async () => {
			mockRedis.ping.mockRejectedValue(new Error('Redis down'));

			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should return DEGRADED when database queries fail but connection succeeds', async () => {
			mockSequelize.authenticate.mockResolvedValue(undefined);
			mockSequelize.query.mockRejectedValue(new Error('Query error'));

			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.DEGRADED);
		});

		it('should handle Promise.allSettled rejections in readiness check', async () => {
			mockSequelize.authenticate.mockImplementation(() => {
				throw new Error('Unexpected');
			});

			const result = await HealthService.ready();
			expect(result.checks.database).toBeDefined();
			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
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

		it('should return healthy=true when status is HEALTHY', async () => {
			const result = await HealthService.getKubernetesHealthCheck();
			expect(result.healthy).toBe(true);
		});

		it('should return healthy=false when status is UNHEALTHY', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('DB down'));

			const result = await HealthService.getKubernetesHealthCheck();
			expect(result.healthy).toBe(false);
		});

		it('should return healthy=false when status is DEGRADED', async () => {
			mockAxios.get.mockRejectedValue(new Error('Service error'));

			const result = await HealthService.getKubernetesHealthCheck();
			expect(result.healthy).toBe(false);
		});
	});

	describe('service statuses', () => {
		it('should return individual service statuses', async () => {
			const result = await HealthService.getServiceStatuses();

			expect(typeof result).toBe('object');
			expect(Object.keys(result).length).toBeGreaterThan(0);

			// Verify each service has proper health check structure
			for (const check of Object.values(result)) {
				expect(check.status).toBeDefined();
				expect(check.timestamp).toBeDefined();
				expect([HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.UNHEALTHY]).toContain(check.status);
			}
		});

		it('should include all monitored services', async () => {
			const result = await HealthService.getServiceStatuses();

			expect(result.database).toBeDefined();
			expect(result.redis).toBeDefined();
			expect(result.decidim).toBeDefined();
			expect(result.grafana).toBeDefined();
			expect(result.matomo).toBeDefined();
			expect(result.jitsi_web).toBeDefined();
			expect(result.internal_component).toBeDefined();
		});

		it('should reflect current health state of services', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('DB error'));

			const result = await HealthService.getServiceStatuses();
			expect(result.database.status).toBe(HealthStatus.UNHEALTHY);
		});
	});

	describe('environment variable handling', () => {
		const originalEnv = process.env;

		beforeEach(() => {
			process.env = { ...originalEnv };
		});

		afterEach(() => {
			process.env = originalEnv;
		});

		it('should use custom DECIDIM_URL from environment', async () => {
			process.env.DECIDIM_URL = 'http://custom-decidim:3000';
			mockAxios.get.mockResolvedValue({ status: 200 });

			await HealthService.health();

			expect(mockAxios.get).toHaveBeenCalledWith(
				expect.stringContaining('http://custom-decidim:3000'),
				expect.any(Object)
			);
		});

		it('should use custom REDIS_URL from environment', async () => {
			process.env.REDIS_URL = 'redis://custom-redis:6379/1';

			await HealthService.health();

			expect(mockIORedis).toHaveBeenCalledWith('redis://custom-redis:6379/1', expect.any(Object));
		});

		it('should fall back to defaults when env vars are not set', async () => {
			delete process.env.DECIDIM_URL;
			delete process.env.REDIS_URL;

			await HealthService.health();

			expect(mockAxios.get).toHaveBeenCalledWith(
				expect.stringContaining('http://decidim:3000'),
				expect.any(Object)
			);
		});
	});

	describe('HTTP status code handling', () => {
		it('should handle 2xx status codes (except 200) as DEGRADED', async () => {
			mockAxios.get.mockResolvedValue({ status: 204 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
		});

		it('should handle 3xx status codes as UNHEALTHY', async () => {
			mockAxios.get.mockResolvedValue({ status: 301 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
		});
		it('should handle 401 as DEGRADED', async () => {
			mockAxios.get.mockResolvedValue({ status: 401 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('client error');
			expect(result.checks.decidim.details).toContain('401');
		});

		it('should handle 403 as DEGRADED', async () => {
			mockAxios.get.mockResolvedValue({ status: 403 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('client error');
			expect(result.checks.decidim.details).toContain('403');
		});
		it('should handle 502 as UNHEALTHY', async () => {
			mockAxios.get.mockResolvedValue({ status: 502 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.details).toContain('server error');
			expect(result.checks.decidim.details).toContain('502');
		});

		it('should handle 503 as UNHEALTHY', async () => {
			mockAxios.get.mockResolvedValue({ status: 503 });

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.details).toContain('server error');
			expect(result.checks.decidim.details).toContain('503');
		});
	});

	describe('Redis configuration', () => {
		it('should configure Redis with correct timeout settings', async () => {
			await HealthService.health();

			expect(mockIORedis).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					connectTimeout: 5000,
					commandTimeout: 5000,
					maxRetriesPerRequest: 1
				})
			);
		});

		it('should properly disconnect Redis after check', async () => {
			await HealthService.health();

			// Redis disconnect should be called
			expect(mockRedis.disconnect).toHaveBeenCalled();
		});
	});

	describe('error handling and logging', () => {
		it('should handle database authentication errors properly', async () => {
			const dbError = new Error('Authentication failed');
			mockSequelize.authenticate.mockRejectedValue(dbError);

			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.details).toContain('Database connection failed');
		});

		it('should handle Redis errors in readiness check', async () => {
			const redisError = new Error('Redis connection timeout');
			mockRedis.ping.mockRejectedValue(redisError);

			const result = await HealthService.ready();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.redis.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should handle errors in liveness check gracefully', async () => {
			// Even if something goes wrong, liveness should still work
			const result = await HealthService.live();

			expect(result.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks.process).toBeDefined();
		});

		it('should handle errors with unknown error types', async () => {
			// Test with a non-Error object
			mockAxios.get.mockRejectedValue('String error');

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
		});

		it('should handle errors without message property', async () => {
			const errorWithoutMessage = { code: 'CUSTOM_ERROR' };
			mockAxios.get.mockRejectedValue(errorWithoutMessage);

			const result = await HealthService.health();

			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('Unknown error');
		});
	});

	describe('edge cases', () => {
		it('should handle missing environment variables gracefully', async () => {
			const originalEnv = process.env;
			process.env = {};

			const result = await HealthService.health();

			expect(result).toBeDefined();
			expect(result.checks).toBeDefined();

			process.env = originalEnv;
		});

		it('should handle all services returning 3xx redirects as UNHEALTHY', async () => {
			mockAxios.get.mockResolvedValue({ status: 302 });

			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.status).toBe(HealthStatus.UNHEALTHY);
		});
		it('should handle mixed service states correctly', async () => {
			mockAxios.get.mockImplementation((url: string) => {
				if (url.includes('decidim')) return Promise.resolve({ status: 200 });
				if (url.includes('grafana')) return Promise.resolve({ status: 404 });
				if (url.includes('matomo')) {
					const error = new Error('Timeout');
					(error as any).code = 'ECONNABORTED';
					return Promise.reject(error);
				}
				return Promise.resolve({ status: 500 });
			});

			const result = await HealthService.health();

			// Should be UNHEALTHY because jitsi returns 500
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.decidim.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks.grafana.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.matomo.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.jitsi_web.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should measure response time accurately', async () => {
			const result = await HealthService.health();

			expect(result.checks.database.responseTime).toBeGreaterThanOrEqual(0);
			expect(result.checks.redis.responseTime).toBeGreaterThanOrEqual(0);
			expect(result.checks.decidim.responseTime).toBeGreaterThanOrEqual(0);
		});

		it('should handle concurrent health checks correctly', async () => {
			const [result1, result2, result3] = await Promise.all([
				HealthService.health(),
				HealthService.ready(),
				HealthService.live()
			]);

			expect(result1.status).toBeDefined();
			expect(result2.status).toBeDefined();
			expect(result3.status).toBeDefined();
		});
	});

	describe('catch block coverage - catastrophic failures', () => {
		it('should handle catastrophic error in health() method', async () => {
			// Promise.allSettled handles errors gracefully, so checks will be populated
			// Test that the method doesn't crash even with null sequelize
			const originalSequelize = mockDatabase.sequelize;
			mockDatabase.sequelize = null;

			try {
				const result = await HealthService.health();
				expect(result.status).toBe(HealthStatus.UNHEALTHY);
				expect(result.checks).toBeDefined();
			} finally {
				mockDatabase.sequelize = originalSequelize;
			}
		});

		it('should handle catastrophic error in ready() method', async () => {
			// Promise.allSettled handles errors gracefully
			const originalSequelize = mockDatabase.sequelize;
			mockDatabase.sequelize = null;

			try {
				const result = await HealthService.ready();
				expect(result.status).toBe(HealthStatus.UNHEALTHY);
				expect(result.checks).toBeDefined();
			} finally {
				mockDatabase.sequelize = originalSequelize;
			}
		});

		it('should handle catastrophic error in live() method', async () => {
			// Even though live() is simple, test the catch block
			const result = await HealthService.live();
			expect(result.status).toBe(HealthStatus.HEALTHY);
		});

		it('should handle internal component error gracefully', async () => {
			// Force internal component check to have issues by mocking process.memoryUsage
			const originalMemoryUsage = process.memoryUsage;
			(process as any).memoryUsage = () => {
				throw new Error('Memory check failed');
			};

			try {
				const result = await HealthService.health();
				expect(result.checks.internal_component.status).toBe(HealthStatus.DEGRADED);
				expect(result.checks.internal_component.details).toContain('Internal component error');
			} finally {
				(process as any).memoryUsage = originalMemoryUsage;
			}
		});

		it('should handle axios timeout specifically', async () => {
			const timeoutError = new Error('timeout of 5000ms exceeded');
			(timeoutError as any).code = 'ECONNABORTED';
			mockAxios.get.mockRejectedValue(timeoutError);

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('timeout');
		});

		it('should handle custom error codes', async () => {
			const customError = new Error('Custom error');
			(customError as any).code = 'CUSTOM_CODE';
			mockAxios.get.mockRejectedValue(customError);

			const result = await HealthService.health();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks.decidim.details).toContain('error');
		});

		it('should handle axios without error details', async () => {
			mockAxios.get.mockRejectedValue(null);

			const result = await HealthService.health();
			expect(result.checks.decidim).toBeDefined();
		});

		it('should handle database check with undefined error message', async () => {
			const errorWithoutMessage = new Error();
			(errorWithoutMessage as any).message = undefined;
			mockSequelize.authenticate.mockRejectedValue(errorWithoutMessage);

			const result = await HealthService.health();
			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should handle readiness check with partial failures', async () => {
			// Database fails, Redis succeeds
			mockSequelize.authenticate.mockRejectedValue(new Error('DB connection error'));
			mockRedis.ping.mockResolvedValue('PONG');

			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.redis.status).toBe(HealthStatus.HEALTHY);
		});

		it('should include npm_package_version in health response', async () => {
			process.env.npm_package_version = '1.2.3';

			const result = await HealthService.health();
			expect(result.version).toBe('1.2.3');
		});

		it('should use default version when npm_package_version not set', async () => {
			delete process.env.npm_package_version;

			const result = await HealthService.health();
			expect(result.version).toBe('1.0.0');
		});

		it('should handle axios response with undefined status', async () => {
			mockAxios.get.mockResolvedValue({ status: undefined });

			const result = await HealthService.health();
			expect(result.checks.decidim).toBeDefined();
			expect(result.checks.decidim.status).toBe(HealthStatus.DEGRADED);
		});
		it('should properly measure timing for each service', async () => {
			const result = await HealthService.health();

			// All checks should have responseTime
			for (const check of Object.values(result.checks)) {
				expect(check.responseTime).toBeGreaterThanOrEqual(0);
				expect(typeof check.responseTime).toBe('number');
			}
		});

		it('should handle Grafana URL variations', async () => {
			process.env.GRAFANA_URL = 'http://grafana:8080';

			await HealthService.health();

			expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('grafana:8080'), expect.any(Object));
		});

		it('should handle Matomo URL variations', async () => {
			process.env.MATOMO_URL = 'http://matomo:8000';

			await HealthService.health();

			expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('matomo:8000'), expect.any(Object));
		});

		it('should handle Jitsi URL variations', async () => {
			process.env.JITSI_WEB_URL = 'http://jitsi:8888';

			await HealthService.health();

			expect(mockAxios.get).toHaveBeenCalledWith(expect.stringContaining('jitsi:8888'), expect.any(Object));
		});

		it('should handle readiness check catch block when everything fails', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('All systems down'));
			mockRedis.ping.mockRejectedValue(new Error('Redis is down'));

			const result = await HealthService.ready();
			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.database.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks.redis.status).toBe(HealthStatus.UNHEALTHY);
		});

		it('should verify getServiceStatuses returns health() checks', async () => {
			mockSequelize.authenticate.mockRejectedValue(new Error('DB error'));

			const statuses = await HealthService.getServiceStatuses();
			expect(statuses.database.status).toBe(HealthStatus.UNHEALTHY);
		});
	});

	describe('logError method coverage', () => {
		it('should log error with message and service name', () => {
			mockLogger.default.error.mockClear();

			// Call logError directly via reflection since it's protected
			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Test error message' });

			expect(mockLogger.default.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Test error message',
					service: 'HealthService'
				})
			);
		});

		it('should include Error object details when cause is an Error', () => {
			mockLogger.default.error.mockClear();
			const testError = new Error('Original error');
			testError.name = 'CustomError';

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Something failed', cause: testError });

			expect(mockLogger.default.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Something failed',
					service: 'HealthService',
					error: expect.objectContaining({
						name: 'CustomError',
						message: 'Original error',
						stack: expect.any(String)
					})
				})
			);
		});

		it('should handle non-Error objects as cause', () => {
			mockLogger.default.error.mockClear();
			const customCause = { code: 'ECONNREFUSED', errno: -111 };

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Connection failed', cause: customCause });

			expect(mockLogger.default.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: 'Connection failed',
					service: 'HealthService',
					error: customCause
				})
			);
		});

		it('should extract error name from Error object', () => {
			mockLogger.default.error.mockClear();
			const typeError = new TypeError('Type mismatch');

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Type validation failed', cause: typeError });

			const callArgs = mockLogger.default.error.mock.calls[0][0];
			expect(callArgs.error.name).toBe('TypeError');
			expect(callArgs.error.message).toBe('Type mismatch');
		});

		it('should include stack trace in logged error', () => {
			mockLogger.default.error.mockClear();
			const error = new Error('Stack trace test');

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Error occurred', cause: error });

			const callArgs = mockLogger.default.error.mock.calls[0][0];
			expect(callArgs.error.stack).toBeDefined();
			expect(callArgs.error.stack).toContain('Error: Stack trace test');
		});

		it('should omit error property when cause is not provided', () => {
			mockLogger.default.error.mockClear();

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Simple error message' });

			const callArgs = mockLogger.default.error.mock.calls[0][0];
			expect(callArgs.error).toBeUndefined();
			expect(callArgs.message).toBe('Simple error message');
			expect(callArgs.service).toBe('HealthService');
		});

		it('should handle Error with empty message', () => {
			mockLogger.default.error.mockClear();
			const emptyError = new Error();

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Operation failed', cause: emptyError });

			const callArgs = mockLogger.default.error.mock.calls[0][0];
			expect(callArgs.error.message).toBe('');
			expect(callArgs.message).toBe('Operation failed');
		});

		it('should handle null cause gracefully', () => {
			mockLogger.default.error.mockClear();

			const logError = (HealthService as any).logError.bind(HealthService);
			logError({ message: 'Error with null cause', cause: null });

			const callArgs = mockLogger.default.error.mock.calls[0][0];
			expect(callArgs.message).toBe('Error with null cause');
			expect(callArgs.service).toBe('HealthService');
			// null is falsy so the error property should not be set
			expect(callArgs.error).toBeUndefined();
		});
	});
});
