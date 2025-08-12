import { FastifyInstance } from 'fastify';
import { build } from '../../../src/app';
import logger from '../../../src/utils/logger';
import { setupDatabase, teardownDatabase, finalCleanup } from './setupTestDB';

// Keep a reference to the server instance
let app: FastifyInstance | null = null;

/**
 * Creates or reuses a test server instance with a clean database
 * This ensures we don't create multiple connection pools
 */
export const createTestServer = async (): Promise<FastifyInstance> => {
	// Create a server instance if it doesn't exist
	if (!app) {
		app = await build();
		await app.ready();
		logger.info('Test server created');
	}

	// Always reset database state to ensure clean tests
	await setupDatabase();

	return app;
};

/**
 * Cleans up the database, but keeps the server running
 * Use this between tests to reset state
 */
export const cleanTestDatabase = async (): Promise<void> => {
	await teardownDatabase();
};

/**
 * Closes the test server and cleans up all resources
 * Call this once at the end of all tests
 */
export const closeTestServer = async (): Promise<void> => {
	try {
		await teardownDatabase();

		if (app) {
			await app.close();
			app = null;
		}

		await finalCleanup();

		logger.info('Test server closed and all resources cleaned up');
	} catch (error) {
		logger.error({ msg: 'Error closing test server', error });

		if (app) {
			try {
				await app.close();
				app = null;
			} catch (closeError) {
				logger.error({ msg: 'Error force closing test server', error: closeError });
			}
		}

		await finalCleanup();
	}
};
