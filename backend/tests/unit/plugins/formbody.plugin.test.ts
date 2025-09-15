// Test coverage for formbody plugin
import { FastifyInstance } from 'fastify';
import formbodyPlugin from '../../../src/plugins/formbody.plugin';

// Mock fastify formbody
jest.mock('@fastify/formbody', () => jest.fn());

describe('Formbody Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register formbody plugin', async () => {
		await formbodyPlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(expect.any(Function));
	});
});
