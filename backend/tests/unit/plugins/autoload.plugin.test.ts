// Test coverage for autoload plugin
import { FastifyInstance } from 'fastify';
import autoloadPlugin from '../../../src/plugins/autoload.plugin';
import autoload from '@fastify/autoload';

// Mock dependencies
jest.mock('@fastify/autoload', () => jest.fn());
jest.mock('path', () => ({
	join: jest.fn().mockReturnValue('/mocked/path/to/routes')
}));

describe('Autoload Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	const mockAutoload = autoload as jest.MockedFunction<typeof autoload>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;

		// Set environment variable
		process.env.CONTEXT_URL = '/api/v1';
	});

	afterEach(() => {
		delete process.env.CONTEXT_URL;
	});

	test('should register autoload with correct configuration', async () => {
		const opts = { someOption: 'value' };

		await autoloadPlugin(mockFastify, opts);

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(mockAutoload, {
			dir: '/mocked/path/to/routes',
			options: {
				prefix: '/api/v1',
				someOption: 'value'
			}
		});
	});

	test('should handle empty opts', async () => {
		await autoloadPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(mockAutoload, {
			dir: '/mocked/path/to/routes',
			options: {
				prefix: '/api/v1'
			}
		});
	});

	test('should handle missing CONTEXT_URL environment variable', async () => {
		delete process.env.CONTEXT_URL;

		await autoloadPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledWith(mockAutoload, {
			dir: '/mocked/path/to/routes',
			options: {
				prefix: undefined
			}
		});
	});
});
