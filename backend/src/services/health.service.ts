import { sequelize } from '../config/database';
import { HealthStatus } from '../enums/health-status.enum';
import { BaseService } from './base/base.service';

const checkDatabase = async (): Promise<string> => {
	let state = HealthStatus.HEALTHY;

	try {
		await sequelize.authenticate();
	} catch (err) {
		state = HealthStatus.UNHEALTHY;
	}

	if (state !== HealthStatus.UNHEALTHY) {
		try {
			await sequelize.query('SELECT 1 LIMIT 1');
		} catch (error) {
			state = HealthStatus.DEGRADED;
		}
	}

	return state;
};

/**
 * Simulates a check on an external API.
 * In practice, you can perform an HTTP request with a short timeout.
 */
const checkExternalAPI = async (): Promise<string> => {
	try {
		// Example: make a fast HTTP call (here simulated)
		// const response = await fetch('https://external-api.example.com/ping', { timeout: 1000 });
		// if (response.ok) return HealthStatus.HEALTHY;
		// else return HealthStatus.DEGRADED;
		return HealthStatus.HEALTHY;
	} catch (error) {
		return HealthStatus.DEGRADED;
	}
};

/**
 * Simulates a check on a critical internal component.
 */
const checkInternalComponent = async (): Promise<string> => {
	try {
		// Example: check memory usage or other internal metrics.
		// In this example, we will always return Healthy.
		return HealthStatus.HEALTHY;
	} catch (error) {
		return HealthStatus.DEGRADED;
	}
};

/**
 * Determines the overall status based on the results of the checks.
 * If at least one check is "Unhealthy", then the overall status will be "Unhealthy".
 * Otherwise, if at least one check is "Degraded", the status will be "Degraded".
 * If all are "Healthy", then the status will be "Healthy".
 */
const getOverallStatus = (results: Record<string, string>): string => {
	if (Object.values(results).includes(HealthStatus.UNHEALTHY)) {
		return HealthStatus.UNHEALTHY;
	} else if (Object.values(results).includes(HealthStatus.DEGRADED)) {
		return HealthStatus.DEGRADED;
	}
	return HealthStatus.HEALTHY;
};

class AuthDataService extends BaseService {
	async health() {
		try {
			// Execute various checks in parallel
			const [dbStatus, externalStatus, internalStatus] = await Promise.all([
				checkDatabase(),
				checkExternalAPI(),
				checkInternalComponent()
			]);

			const checks = {
				database: dbStatus,
				external_api: externalStatus,
				internal_component: internalStatus
			};

			const overallStatus = getOverallStatus(checks);

			return {
				status: overallStatus,
				checks
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY
			};
		}
	}

	async ready() {
		try {
			// For example, in Readiness you might only check the database and some critical dependencies
			const dbStatus = await checkDatabase();
			const readinessChecks = {
				database: dbStatus
				// Add other specific checks for readiness if necessary
			};

			const overallStatus = getOverallStatus(readinessChecks);

			return {
				status: overallStatus,
				checks: readinessChecks
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY
			};
		}
	}

	async live() {
		try {
			// For liveness, a very simple check is enough
			const liveChecks = {
				process: HealthStatus.HEALTHY
			};

			return {
				status: HealthStatus.HEALTHY,
				checks: liveChecks
			};
		} catch (error) {
			this.logError({ message: (error as Error).message || 'Error occur', cause: error });
			return {
				status: HealthStatus.UNHEALTHY
			};
		}
	}
}

export default new AuthDataService();
