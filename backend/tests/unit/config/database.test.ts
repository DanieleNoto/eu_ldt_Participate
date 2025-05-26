/* eslint-disable @typescript-eslint/no-explicit-any */
import * as path from 'path';
import { Sequelize } from 'sequelize-typescript';
import { createDatabaseConnection, createInMemoryDB } from '../../../src/config/database';

jest.mock('path');
jest.mock('sequelize-typescript');
jest.mock('../../../src/utils/logger', () => ({
	debug: jest.fn(),
	info: jest.fn()
}));

// Proper type for mocked Sequelize
const MockedSequelize = Sequelize as unknown as jest.Mock;

describe('Database configuration', () => {
	const origEnv = process.env;
	let mockSequelizeInstance: any;

	beforeEach(() => {
		jest.clearAllMocks();
		process.env = { ...origEnv };

		mockSequelizeInstance = {
			dialect: 'sqlite',
			storage: ':memory:'
		};

		MockedSequelize.mockImplementation(() => mockSequelizeInstance);
		(path.join as jest.Mock).mockReturnValue('mocked/path');
	});

	afterEach(() => {
		process.env = origEnv;
	});

	describe('createDatabaseConnection', () => {
		it('should create in-memory DB when storage is defined', () => {
			process.env.DATABASE_STORAGE = ':memory:';

			createDatabaseConnection();

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.objectContaining({
					storage: ':memory:'
				})
			);
		});

		it('should create regular DB connection when storage is not defined', () => {
			process.env.DATABASE_STORAGE = undefined;
			process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

			createDatabaseConnection();

			expect(MockedSequelize).toHaveBeenCalledWith('postgres://user:pass@localhost:5432/db', expect.any(Object));
		});

		it('should use default dialect and schema values', () => {
			process.env.DATABASE_STORAGE = undefined;
			process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
			process.env.DB_DIALECT = undefined;
			process.env.DB_SCHEMA = undefined;

			createDatabaseConnection();

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					dialect: 'postgres',
					define: { schema: 'public' }
				})
			);
		});

		it('should use development logging when in development', () => {
			process.env.DATABASE_STORAGE = undefined;
			process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
			process.env.NODE_ENV = 'development';

			createDatabaseConnection();

			const callArgs = MockedSequelize.mock.calls[0][1];
			expect(callArgs && callArgs.logging).not.toBe(false);
		});

		it('should use configured pool values including acquire and evict', () => {
			process.env.DATABASE_STORAGE = undefined;
			process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
			process.env.DB_MAX_POOL = '20';
			process.env.DB_MIN_POOL = '5';
			process.env.DB_IDLE_POOL = '20000';
			process.env.DB_ACQUIRE_POOL = '65000';
			process.env.DB_EVICT_POOL = '2000';

			createDatabaseConnection();

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					pool: {
						max: 20,
						min: 5,
						idle: 20000,
						acquire: 65000,
						evict: 2000
					}
				})
			);
		});
	});

	describe('createInMemoryDB', () => {
		it('should create in-memory DB with default pool values', () => {
			process.env.DB_MAX_POOL = undefined;
			process.env.DB_MIN_POOL = undefined;
			process.env.DB_IDLE_POOL = undefined;

			createInMemoryDB(':memory:', 'sqlite');

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.objectContaining({
					pool: {
						max: 10,
						min: 2,
						idle: 10000
					}
				})
			);
		});

		it('should use configured pool values', () => {
			process.env.DB_MAX_POOL = '20';
			process.env.DB_MIN_POOL = '5';
			process.env.DB_IDLE_POOL = '20000';

			createInMemoryDB(':memory:', 'sqlite');

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.objectContaining({
					pool: {
						max: 20,
						min: 5,
						idle: 20000
					}
				})
			);
		});

		it('should set up logging function', () => {
			createInMemoryDB(':memory:', 'sqlite');

			// Check that Sequelize was called with an object containing a logging function
			expect(MockedSequelize).toHaveBeenCalled();
			const options = MockedSequelize.mock.calls[0][0];
			expect(typeof options.logging).toBe('function');

			// Test that the logging function calls logger.info
			const loggingFn = options.logging;
			loggingFn('test log message');
			expect(require('../../../src/utils/logger').info).toHaveBeenCalledWith('test log message');
		});

		it('should use sqlite as default dialect when not specified', () => {
			createInMemoryDB(':memory:');

			expect(MockedSequelize).toHaveBeenCalledWith(
				expect.objectContaining({
					dialect: undefined,
					storage: ':memory:'
				})
			);
		});
	});
});
