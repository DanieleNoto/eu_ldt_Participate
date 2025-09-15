// Test coverage for underpressure plugin
import { FastifyInstance } from 'fastify';
import underpressurePlugin from '../../../src/plugins/underpressure.plugin';

// Mock fastify underpressure
jest.mock('@fastify/under-pressure', () => jest.fn());

describe('Underpressure Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			register: jest.fn()
		} as any;
	});

	test('should register underpressure plugin', async () => {
		await underpressurePlugin(mockFastify, {});

		expect(mockFastify.register).toHaveBeenCalledTimes(1);
		expect(mockFastify.register).toHaveBeenCalledWith(expect.any(Function), expect.any(Object));
	});
});
