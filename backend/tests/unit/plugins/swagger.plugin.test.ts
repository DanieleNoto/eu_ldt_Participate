// Test coverage for swagger plugin
import { FastifyInstance } from 'fastify';
import swaggerPlugin from '../../../src/plugins/swagger.plugin';

// Mock swagger plugins
jest.mock('@fastify/swagger', () => jest.fn());
jest.mock('@fastify/swagger-ui', () => jest.fn());

describe('Swagger Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register swagger and swagger-ui plugins', async () => {
		await swaggerPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledTimes(2);
		expect(mockFastify.register).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));
	});
});
