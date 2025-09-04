// Test coverage for standard logger plugin
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import loggingPlugin from '../../../src/plugins/standard-logger.plugin';
import { formatLog } from '../../../src/utils/logger';

// Mock the logger utility
jest.mock('../../../src/utils/logger', () => ({
	formatLog: jest.fn()
}));

describe('Standard Logger Plugin', () => {
	let mockFastify: jest.Mocked<FastifyInstance>;
	let mockRequest: jest.Mocked<FastifyRequest>;
	let mockReply: jest.Mocked<FastifyReply>;
	const mockFormatLog = formatLog as jest.MockedFunction<typeof formatLog>;

	beforeEach(() => {
		jest.clearAllMocks();

		mockFastify = {
			addHook: jest.fn()
		} as any;

		mockRequest = {
			method: 'GET',
			url: '/test-endpoint'
		} as any;

		mockReply = {
			statusCode: 200
		} as any;
	});

	test('should register onRequest, onResponse, and onError hooks', async () => {
		await loggingPlugin(mockFastify);

		expect(mockFastify.addHook).toHaveBeenCalledTimes(3);
		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onResponse', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onError', expect.any(Function));
	});

	test('should register plugin hooks correctly', async () => {
		await loggingPlugin(mockFastify);

		// Verify the plugin registers hooks
		expect(mockFastify.addHook).toHaveBeenCalledTimes(3);
		expect(mockFastify.addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onResponse', expect.any(Function));
		expect(mockFastify.addHook).toHaveBeenCalledWith('onError', expect.any(Function));
	});
});
