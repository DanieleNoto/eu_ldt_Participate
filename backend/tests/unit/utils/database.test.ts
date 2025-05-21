// Code Coverage
import { createDBConnection, isSQLite, ofString, runSeeders } from '../../../src/utils/database';

jest.mock('../../../src/config/database', () => ({
	sequelize: { authenticate: jest.fn(), sync: jest.fn(), getQueryInterface: jest.fn() }
}));
jest.mock('../../../src/models/entities/scopes', () => ({ loadScopes: jest.fn() }));
jest.mock('../../../src/utils/logger', () => ({ info: jest.fn(), error: jest.fn(), debug: jest.fn() }));
jest.mock('umzug', () => ({
	Umzug: jest.fn().mockImplementation(() => ({ pending: jest.fn().mockResolvedValue([]), up: jest.fn() })),
	SequelizeStorage: jest.fn()
}));

describe('database utils', () => {
	beforeEach(() => {
		process.env.DB_DIALECT = 'sqlite';
		process.env.DATABASE_SYNC = 'false';
	});

	it('should export isSQLite and ofString', () => {
		expect(isSQLite).toBe(true);
		expect(ofString).toBeDefined();
	});

	it('should connect to the database', async () => {
		await expect(createDBConnection()).resolves.toBeUndefined();
	});

	it('should run seeders with no pending', async () => {
		await expect(runSeeders()).resolves.toBeUndefined();
	});
});
