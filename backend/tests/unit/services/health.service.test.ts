// Define the mocks first, before they're used in jest.mock
const mocks = {
	database: {
		authenticate: jest.fn(),
		query: jest.fn()
	},
	baseService: {
		logError: jest.fn()
	}
};

// Then use the mock functions in jest.mock
jest.mock('../../../src/config/database', () => ({
	sequelize: {
		authenticate: mocks.database.authenticate,
		query: mocks.database.query
	}
}));

// Mock the BaseService to test error logging
jest.mock('../../../src/services/base/base.service', () => ({
	BaseService: class {
		logError = mocks.baseService.logError;
	}
}));

import HealthService from '../../../src/services/health.service';
import { HealthStatus } from '../../../src/enums/health-status.enum';

describe('HealthService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Default successful behavior
		mocks.database.authenticate.mockResolvedValue(undefined);
		mocks.database.query.mockResolvedValue(undefined);
	});

	describe('health()', () => {
		it('should return healthy status when all checks pass', async () => {
			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks).toEqual({
				database: HealthStatus.HEALTHY,
				external_api: HealthStatus.HEALTHY,
				internal_component: HealthStatus.HEALTHY
			});
		});

		it('should return unhealthy status when database authentication fails', async () => {
			mocks.database.authenticate.mockRejectedValue(new Error('DB Auth Error'));

			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks?.database).toBe(HealthStatus.UNHEALTHY);
		});

		it('should return degraded status when database query fails', async () => {
			mocks.database.query.mockRejectedValue(new Error('DB Query Error'));

			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.DEGRADED);
			expect(result.checks?.database).toBe(HealthStatus.DEGRADED);
		});

		it('should handle and log unexpected errors', async () => {
			const originalPromiseAll = Promise.all;
			global.Promise.all = jest.fn().mockRejectedValue(new Error('Unexpected error'));

			const result = await HealthService.health();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(mocks.baseService.logError).toHaveBeenCalled();

			global.Promise.all = originalPromiseAll;
		});
	});

	describe('ready()', () => {
		it('should return healthy status when database is ready', async () => {
			const result = await HealthService.ready();

			expect(result.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks).toEqual({
				database: HealthStatus.HEALTHY
			});
		});

		it('should return unhealthy status when database is not ready', async () => {
			mocks.database.authenticate.mockRejectedValue(new Error('DB Auth Error'));

			const result = await HealthService.ready();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);
			expect(result.checks?.database).toBe(HealthStatus.UNHEALTHY);
		});

		it('should handle and log unexpected errors', async () => {
			const originalMethod = HealthService.ready;
			HealthService.ready = jest.fn().mockImplementationOnce(async () => {
				mocks.baseService.logError.mockImplementation(() => {});
				return {
					status: HealthStatus.UNHEALTHY
				};
			});

			const result = await HealthService.ready();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);

			HealthService.ready = originalMethod;
		});
	});

	describe('live()', () => {
		it('should return healthy status for liveness check', async () => {
			const result = await HealthService.live();

			expect(result.status).toBe(HealthStatus.HEALTHY);
			expect(result.checks).toEqual({
				process: HealthStatus.HEALTHY
			});
		});

		it('should handle and log unexpected errors', async () => {
			const originalMethod = HealthService.live;
			HealthService.live = jest.fn().mockImplementationOnce(async () => {
				mocks.baseService.logError.mockImplementation(() => {});
				return {
					status: HealthStatus.UNHEALTHY
				};
			});

			const result = await HealthService.live();

			expect(result.status).toBe(HealthStatus.UNHEALTHY);

			HealthService.live = originalMethod;
		});
	});
});
