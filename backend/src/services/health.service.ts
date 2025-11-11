import axios from 'axios';
import Redis from 'ioredis';
import { sequelize } from '../config/database';
import logger from '../utils/logger';

// Health status constants
const HealthStatus = {
	HEALTHY: 'healthy',
	UNHEALTHY: 'unhealthy',
	DEGRADED: 'degraded'
} as const;

interface HealthCheck {
	status: string;
	timestamp: string;
	responseTime?: number;
	details?: string;
}

interface ServiceHealthResult {
	status: string;
	checks: Record<string, HealthCheck>;
	timestamp: string;
	version?: string;
}

const checkDatabase = async (): Promise<HealthCheck> => {
	const startTime = Date.now();
	let state: string = HealthStatus.HEALTHY;
	let details = '';

	try {
		await sequelize.authenticate();
		details = 'Database connection successful';
	} catch (err) {
		state = HealthStatus.UNHEALTHY;
		details = `Database connection failed: ${(err as Error).message}`;
	}

	if (state !== HealthStatus.UNHEALTHY) {
		try {
			await sequelize.query('SELECT 1 LIMIT 1');
			details = 'Database query successful';
		} catch (error) {
			state = HealthStatus.DEGRADED;
			details = `Database query failed: ${(error as Error).message}`;
		}
	}

	return {
		status: state,
		timestamp: new Date().toISOString(),
		responseTime: Date.now() - startTime,
		details
	};
};

const checkRedis = async (): Promise<HealthCheck> => {
	const startTime = Date.now();
	let state: string = HealthStatus.HEALTHY;
	let details = '';

	try {
		const redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379/0';
		const redis = new Redis(redisUrl, {
			connectTimeout: 5000,
			commandTimeout: 5000,
			maxRetriesPerRequest: 1
		});

		await redis.ping();
		details = 'Redis connection successful';
		await redis.disconnect();
	} catch (err) {
		state = HealthStatus.UNHEALTHY;
		details = `Redis connection failed: ${(err as Error).message}`;
	}

	return {
		status: state,
		timestamp: new Date().toISOString(),
		responseTime: Date.now() - startTime,
		details
	};
};

const getStatusFromResponse = (status: number, serviceName: string): { state: string; details: string } => {
	if (status >= 200 && status < 400) {
		return { state: HealthStatus.HEALTHY, details: `${serviceName} is responsive (HTTP ${status})` };
	} else if (status >= 400 && status < 500) {
		return { state: HealthStatus.DEGRADED, details: `${serviceName} client error (HTTP ${status})` };
	} else {
		return { state: HealthStatus.UNHEALTHY, details: `${serviceName} server error (HTTP ${status})` };
	}
};

const getStatusFromError = (
	error: Error & { code?: string; response?: { status: number } },
	serviceName: string
): { state: string; details: string } => {
	if (error.response) {
		if (error.response.status >= 400 && error.response.status < 500) {
			return {
				state: HealthStatus.DEGRADED,
				details: `${serviceName} client error (HTTP ${error.response.status})`
			};
		} else {
			return {
				state: HealthStatus.UNHEALTHY,
				details: `${serviceName} server error (HTTP ${error.response.status})`
			};
		}
	} else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
		return { state: HealthStatus.UNHEALTHY, details: `${serviceName} is not reachable` };
	} else if (error.code === 'ECONNABORTED') {
		return { state: HealthStatus.DEGRADED, details: `${serviceName} timeout` };
	} else {
		return { state: HealthStatus.DEGRADED, details: `${serviceName} error: ${error.message || 'Unknown error'}` };
	}
};

const checkHttpService = async (url: string, serviceName: string, timeout: number = 5000): Promise<HealthCheck> => {
	const startTime = Date.now();

	try {
		const response = await axios.get(url, {
			timeout,
			validateStatus: () => true // Don't throw error on non-2xx status
		});

		const { state, details } = getStatusFromResponse(response.status, serviceName);

		return {
			status: state,
			timestamp: new Date().toISOString(),
			responseTime: Date.now() - startTime,
			details
		};
	} catch (err) {
		const error = err as Error & { code?: string; response?: { status: number } };
		const { state, details } = getStatusFromError(error, serviceName);

		return {
			status: state,
			timestamp: new Date().toISOString(),
			responseTime: Date.now() - startTime,
			details
		};
	}
};

const checkDecidim = async (): Promise<HealthCheck> => {
	const decidimUrl = process.env.DECIDIM_URL ?? 'http://decidim:3000';
	return checkHttpService(`${decidimUrl}/health_check`, 'Decidim', 10000);
};

const checkGrafana = async (): Promise<HealthCheck> => {
	const grafanaUrl = process.env.GRAFANA_URL ?? 'http://grafana:3000';
	return checkHttpService(`${grafanaUrl}/api/health`, 'Grafana');
};

const checkMatomo = async (): Promise<HealthCheck> => {
	const matomoUrl = process.env.MATOMO_URL ?? 'http://matomo:80';
	return checkHttpService(`${matomoUrl}/matomo.php`, 'Matomo');
};

const checkJitsiWeb = async (): Promise<HealthCheck> => {
	const jitsiUrl = process.env.JITSI_WEB_URL ?? 'http://jitsi-web:80';
	return checkHttpService(jitsiUrl, 'Jitsi Web');
};

/**
 * Simulates a check on a critical internal component.
 */
const checkInternalComponent = async (): Promise<HealthCheck> => {
	const startTime = Date.now();
	try {
		// Example: check memory usage or other internal metrics.
		const memUsage = process.memoryUsage();
		const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
		const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

		return {
			status: HealthStatus.HEALTHY,
			timestamp: new Date().toISOString(),
			responseTime: Date.now() - startTime,
			details: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB`
		};
	} catch (error) {
		return {
			status: HealthStatus.DEGRADED,
			timestamp: new Date().toISOString(),
			responseTime: Date.now() - startTime,
			details: `Internal component error: ${(error as Error).message}`
		};
	}
};

/**
 * Determines the overall status based on the results of the checks.
 * If at least one check is "Unhealthy", then the overall status will be "Unhealthy".
 * Otherwise, if at least one check is "Degraded", the status will be "Degraded".
 * If all are "Healthy", then the status will be "Healthy".
 */
const getOverallStatus = (results: Record<string, HealthCheck>): string => {
	const statuses = Object.values(results).map(check => check.status);

	if (statuses.includes(HealthStatus.UNHEALTHY)) {
		return HealthStatus.UNHEALTHY;
	} else if (statuses.includes(HealthStatus.DEGRADED)) {
		return HealthStatus.DEGRADED;
	}
	return HealthStatus.HEALTHY;
};

class HealthService {
	async health(): Promise<ServiceHealthResult> {
		try {
			// Execute various checks in parallel
			const [dbStatus, redisStatus, decidimStatus, grafanaStatus, matomoStatus, jitsiWebStatus, internalStatus] =
				await Promise.allSettled([
					checkDatabase(),
					checkRedis(),
					checkDecidim(),
					checkGrafana(),
					checkMatomo(),
					checkJitsiWeb(),
					checkInternalComponent()
				]);

			const checks: Record<string, HealthCheck> = {
				database:
					dbStatus.status === 'fulfilled'
						? dbStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				redis:
					redisStatus.status === 'fulfilled'
						? redisStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				decidim:
					decidimStatus.status === 'fulfilled'
						? decidimStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				grafana:
					grafanaStatus.status === 'fulfilled'
						? grafanaStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				matomo:
					matomoStatus.status === 'fulfilled'
						? matomoStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				jitsi_web:
					jitsiWebStatus.status === 'fulfilled'
						? jitsiWebStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							},
				internal_component:
					internalStatus.status === 'fulfilled'
						? internalStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Health check failed to execute'
							}
			};

			const overallStatus = getOverallStatus(checks);

			return {
				status: overallStatus,
				checks,
				timestamp: new Date().toISOString(),
				version: process.env.npm_package_version ?? '1.0.0'
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY,
				checks: {},
				timestamp: new Date().toISOString()
			};
		}
	}

	async ready(): Promise<ServiceHealthResult> {
		try {
			// For readiness, check critical dependencies only
			const [dbStatus, redisStatus] = await Promise.allSettled([checkDatabase(), checkRedis()]);

			const readinessChecks: Record<string, HealthCheck> = {
				database:
					dbStatus.status === 'fulfilled'
						? dbStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Database check failed to execute'
							},
				redis:
					redisStatus.status === 'fulfilled'
						? redisStatus.value
						: {
								status: HealthStatus.UNHEALTHY,
								timestamp: new Date().toISOString(),
								details: 'Redis check failed to execute'
							}
			};

			const overallStatus = getOverallStatus(readinessChecks);

			return {
				status: overallStatus,
				checks: readinessChecks,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY,
				checks: {},
				timestamp: new Date().toISOString()
			};
		}
	}

	async live(): Promise<ServiceHealthResult> {
		try {
			// For liveness, a very simple check is enough
			const liveChecks: Record<string, HealthCheck> = {
				process: {
					status: HealthStatus.HEALTHY,
					timestamp: new Date().toISOString(),
					details: 'Process is running'
				}
			};

			return {
				status: HealthStatus.HEALTHY,
				checks: liveChecks,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY,
				checks: {},
				timestamp: new Date().toISOString()
			};
		}
	}

	async getServiceStatuses(): Promise<Record<string, HealthCheck>> {
		const healthResult = await this.health();
		return healthResult.checks;
	}

	async getKubernetesHealthCheck(): Promise<{
		healthy: boolean;
		details: ServiceHealthResult;
	}> {
		const healthResult = await this.health();
		return {
			healthy: healthResult.status === HealthStatus.HEALTHY,
			details: healthResult
		};
	}

	/**
	 * Log error with structured logging
	 */
	protected logError(options: { message: string; cause?: unknown }): void {
		const { message, cause } = options;

		const logData: Record<string, unknown> = {
			message,
			service: 'HealthService'
		};

		if (cause) {
			logData.error =
				cause instanceof Error
					? {
							name: cause.name,
							message: cause.message,
							stack: cause.stack
						}
					: cause;
		}

		logger.error(logData);
	}
}

export default new HealthService();
