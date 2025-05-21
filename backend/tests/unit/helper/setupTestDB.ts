import { sequelize } from '../../../src/config/database';

/**
 * Sets up a clean test database by dropping all tables and recreating them
 */
export const setupDatabase = async () => {
	sequelize.options.logging = false;
	// Use force:true to drop tables and recreate them
	await sequelize.sync({ force: true });
};

/**
 * Cleans up the test database without closing the connection
 */
export const teardownDatabase = async () => {
	await sequelize.truncate({ cascade: true });
};

/**
 * Final cleanup to be called once at the end of all tests
 */
export const finalCleanup = async () => {
	await sequelize.close();
};
